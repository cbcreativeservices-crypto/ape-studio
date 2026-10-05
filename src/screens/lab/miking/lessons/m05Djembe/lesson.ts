/**
 * M05 DJEMBE — the lesson's pages as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Djembe-Miking-Technique-Research.txt, "L<n>"
 * in COMMENTS only) with the fixes logged in CORRECTIONS_LOG.md (DJ-…).
 * The two published examples (a close top mic and a low mic; a farther top
 * mic and a mic underneath) are taught as different case examples, never as
 * rules (the lesson's own framing), in the starting-points voice.
 * The practice page is the shared PPractice: its ids (k.prac.*, k.mix.*) are
 * that page's contract.
 */
import type { DiagnosticItem, MikingScenario, OrderTask, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { handCopy, type HandLesson } from '../shared/handdrums/family.ts';
import { DJ_MODEL, DJ_WORDS } from './geometry.ts';
import { DJEMBE, DJ_DIMS as D, DJ_ZONES, HEAD_Y } from './model.ts';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the djembe',
    goal: 'Get to know the djembe — what it is, where you meet it, what it does in the music, and its parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A single-headed goblet drum, rope-tuned, open at the bottom: the head gives the slap and tone, the open foot lets out much of the bass. Work with the drum as the player holds or supports it.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how bass, tone and slap become sound — the head, the air in the bowl, the open foot — and where each leaves the drum. Shown, never played.',
    credit: { scenarios: ['dj.snd.1', 'dj.snd.2', 'dj.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Slaps and tones start at the head, near its edge; the bass is struck near the centre, and much of it resonates out of the open foot. A mic hears more of whichever it is near and facing — test one mic before adding another.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the djembe sits in a group, the player’s space — hands, knees, feet, a tilted drum — and what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['dj.set.1', 'dj.set.2', 'dj.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Hands, wrists, knees, feet and the drum’s own movement are the player’s space: no stand, cable or prop goes there, and nothing under a drum resting on the floor. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the djembe by its properties — pattern, power, size, mount and peak level — not by its brand.',
    credit: { scenarios: ['dj.mic.1', 'dj.mic.2', 'dj.mic.3', 'dj.mic.4', 'dj.rec.1'], note: 'Answer the five checks (one reaches back to how the djembe sounds).' },
    takeaway: 'A suitable dynamic or condenser can serve above or below. Pattern, response, peak level, size and mounting matter more than a stereotype — and a mic’s maximum SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — one mic above the head first; a low mic only when the opening is clear — outside every hand, knee and foot; then move it and see what changes.',
    credit: { scenarios: ['dj.place.1', 'dj.place.2', 'dj.place.3', 'dj.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'Two published starting points sit very close and quite far above the head: different cases, not rules. If one mic carries enough bass, a second is unnecessary; a low mic only where the opening is clear.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces the floor wedge — and know what a pattern cannot do.',
    credit: { scenarios: ['dj.ctx.1', 'dj.ctx.2', 'dj.ctx.studio', 'dj.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: tilt the mic (or change its pattern) until the floor wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Point pickup and rejection by the actual pattern: supercardioid and hypercardioid rear lobes differ from a cardioid’s. A bottom mic near a floor wedge hears the monitor too. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'With a top mic and a low or under mic, see how the arrival-time difference places comb-filter notches — and what polarity does and does not change.',
    credit: { scenarios: ['dj.two.1', 'dj.two.2', 'dj.two.3', 'dj.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'The top and bottom mics hear different parts of the sound at different times. A polarity flip is a diagnostic option, not automatically correct — never invert a channel just because it is below the drum.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the one-mic position, the opening, the player’s movement, the gain and the mono blend before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second, lower channel.',
    credit: { scenarios: ['k.prac.order', 'k.prac.gain', 'k.prac.setup1', 'k.prac.setup2', 'k.prac.3', 'k.mix.1', 'k.mix.2', 'k.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real drum.' },
    takeaway: 'Safe capture with one mic first; bass, tone and slap all represented; a lower mic only when feasible; a mono check for any pair. More than one setup can pass.',
  },
};

/* Lesson refs (comments only): dj.set.* L5-L6, L24-L26 · dj.snd.* L5-L6, WP-DJEMBE ·
 * dj.mic.* L16, L25 · dj.place.* L10-L15 · dj.ctx.* L17-L23 · dj.two.* L27-L28 ·
 * practice L29-L42. */
const scenarios: MikingScenario[] = [
  {
    id: 'dj.set.1',
    page: 'setting',
    prompt: 'The player sits with the djembe between their knees and tilts it as they play. What must a mic stand stay clear of?',
    options: ['Hands, wrists, knees, feet — and the tilting drum itself', 'The front of the drum, so the audience can see the head', 'The rope tuning, so the drum stays in tune while playing'],
    correct: 'Hands, wrists, knees, feet — and the tilting drum itself',
    explain: 'Map the complete hand, wrist, knee, leg and drum-motion envelope; leave clearance for slaps and a tilted shell, and make sure no hardware can fall or pivot toward the player.',
    why: {
      'The front of the drum, so the audience can see the head': 'How it looks is not the safety question. The player’s body and the moving drum are.',
      'The rope tuning, so the drum stays in tune while playing': 'Clamp nothing to the ropes, but the space that moves is the player’s and the drum’s.',
    },
  },
  {
    id: 'dj.set.2',
    page: 'setting',
    prompt: 'Your djembe mic is rated to a very high maximum SPL. Does that tell you how long you can sit beside the drum through soundcheck?',
    options: ['No — that is the mic’s distortion limit, not a hearing limit', 'Yes — anything below the mic’s rating is safe for people nearby', 'Yes, as long as the mic is closer to the drum than you are'],
    correct: 'No — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Human noise-exposure guidance is separate from the mic’s peak SPL rating. A widely used guideline is no more than 85 dBA averaged over 8 hours, and every 3 dBA more halves the time — manage loud rehearsals.',
    why: {
      'Yes — anything below the mic’s rating is safe for people nearby': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'Yes, as long as the mic is closer to the drum than you are': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  },
  {
    id: 'dj.set.3',
    page: 'setting',
    prompt: 'The djembe rests flat on the floor. Can you put a mic under its opening?',
    options: ['No — on the floor the opening is closed; don’t prop it up for a mic', 'Yes — tip the drum onto a block or a book so a small mic fits underneath', 'Yes — a thin mic can slide under the foot’s edge'],
    correct: 'No — on the floor the opening is closed; don’t prop it up for a mic',
    explain: 'Do not place a mic under a drum resting on the floor, alter how the player supports it, or prop it precariously. If there is no safe, repeatable lower position, keep one well-placed top mic.',
    why: {
      'Yes — tip the drum onto a block or a book so a small mic fits underneath': 'Never prop the player’s drum precariously for a mic. Ask how they support it.',
      'Yes — a thin mic can slide under the foot’s edge': 'That blocks the opening and sits under a resting drum. Keep one good top mic instead.',
    },
  },
  {
    id: 'dj.snd.1',
    page: 'sound',
    prompt: 'Where on the head is a djembe’s bass stroke played?',
    options: ['With the palm and flat fingers, near the centre', 'With the fingertips, right at the edge', 'With the side of the hand, on the rope ring at the top'],
    correct: 'With the palm and flat fingers, near the centre',
    explain: 'The bass is struck with the palm and flat fingers near the centre; tone and slap are struck closer to the edge.',
    why: {
      'With the fingertips, right at the edge': 'That is nearer a slap. The bass is played near the centre with the palm.',
      'With the side of the hand, on the rope ring at the top': 'The ring is not struck. The bass is played near the centre of the head.',
    },
  },
  {
    id: 'dj.snd.2',
    page: 'sound',
    prompt: 'A tone and a slap are both struck close to the edge. What makes them different?',
    options: ['How much of the fingers and palm meet the head', 'How far from the centre each one lands', 'How tight the ropes are pulled for each one'],
    correct: 'How much of the fingers and palm meet the head',
    explain: 'For a tone most of the fingers and the edge of the palm meet the skin; for a slap, only the edge of the palm and the fingertips. The simplified head shows WHERE a stroke lands, not how the hand meets it.',
    why: {
      'How far from the centre each one lands': 'Both land close to the edge; the contact area is what differs.',
      'How tight the ropes are pulled for each one': 'The tuning stays the same; the hand’s contact makes the difference.',
    },
  },
  {
    id: 'dj.snd.3',
    page: 'sound',
    prompt: 'What mostly sets the pitch of a djembe’s deep bass note?',
    options: ['The size and shape of the shell, not the skin’s tension', 'How tightly the ropes pull the goat skin over the top of the bowl', 'How hard the player strikes the head'],
    correct: 'The size and shape of the shell, not the skin’s tension',
    explain: 'The bass is the air in the bowl resonating through the waist and the open foot: its pitch is set by the shell’s size and shape, independent of the skin’s tension — and much of it leaves through the bottom.',
    why: {
      'How tightly the ropes pull the goat skin over the top of the bowl': 'Tension sets the head’s tones and slaps; the bass note is set by the shell.',
      'How hard the player strikes the head': 'Harder makes it louder, not lower or higher. The shell sets the bass pitch.',
    },
  },
  {
    id: 'dj.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A low mic aimed at the open foot tends to hear more of what?',
    options: ['The bass resonating out of the bottom of the drum', 'The slaps, struck near the edge of the head', 'Only the floor, since it sits so close to it'],
    correct: 'The bass resonating out of the bottom of the drum',
    explain: 'A lot of bass resonates out of the bottom of the drum. A low mic is a selectable bass perspective — often with less hand articulation.',
    why: {
      'The slaps, struck near the edge of the head': 'Slaps start at the head, on top. The foot carries the bass.',
      'Only the floor, since it sits so close to it': 'It hears the drum’s bottom opening — and floor reflections and foot noise too, which is why you check it.',
    },
  },
  {
    id: 'dj.mic.1',
    page: 'microphone',
    prompt: 'The only spare input has no phantom power. Which of this page’s mic types can you still use?',
    options: ['The two compact dynamics: neither needs power', 'The slim condenser, since it is a small one', 'The slim condenser, if you keep it farther away'],
    correct: 'The two compact dynamics: neither needs power',
    explain: 'Dynamic mics need no power. A condenser needs phantom power — check its powering and peak input requirements before choosing it.',
    why: {
      'The slim condenser, since it is a small one': 'Size does not decide power: a condenser still needs phantom power.',
      'The slim condenser, if you keep it farther away': 'Distance does not change what a condenser needs: it still needs phantom power.',
    },
  },
  {
    id: 'dj.mic.2',
    page: 'microphone',
    prompt: 'A maker lists its compact low-frequency dynamic for djembe. What does that tell you about where to put it?',
    options: ['Nothing about position — it lists a use, not a location', 'Under the drum, since it is a bass mic', 'Inside the bowl, through the foot, as close to the bass as it can get'],
    correct: 'Nothing about position — it lists a use, not a location',
    explain: 'A product page listing djembe as an application does not prescribe a location. Place it by the part, the opening and the player.',
    why: {
      'Under the drum, since it is a bass mic': 'The listing names a use; whether a low position is safe and useful depends on the drum and its support.',
      'Inside the bowl, through the foot, as close to the bass as it can get': 'Nothing goes into the drum or blocks its opening.',
    },
  },
  {
    id: 'dj.mic.3',
    page: 'microphone',
    prompt: 'One account found a top mic “slap-heavy”; another found plenty of bass from a top mic. What do you conclude?',
    options: ['Different setups — test the one top mic before adding a second', 'One account is wrong, so trust the more recent one', 'Top mics carry too little bass, so a low mic is needed as well'],
    correct: 'Different setups — test the one top mic before adding a second',
    explain: 'Mic model, location, drum, player, support and setting differ, so the evidence is not a contradiction under identical conditions. Test the single upper mic first.',
    why: {
      'One account is wrong, so trust the more recent one': 'They describe different setups, not one experiment. Test it on the drum in front of you.',
      'Top mics carry too little bass, so a low mic is needed as well': 'One comparison found a full bass from a top mic. Test before adding a channel.',
    },
  },
  {
    id: 'dj.mic.4',
    page: 'microphone',
    prompt: 'Does a condenser automatically overload on a djembe, or a dynamic automatically sound dull?',
    options: ['No — check the actual model’s peak level and response', 'Yes — condensers overload on a hand drum played this hard', 'Yes — dynamics lose the slap'],
    correct: 'No — check the actual model’s peak level and response',
    explain: 'Do not infer that every condenser overloads or every dynamic is dull. Pattern, response, maximum SPL, size and mounting matter more than a transducer stereotype.',
    why: {
      'Yes — condensers overload on a hand drum played this hard': 'That depends on the model’s rated peak level and where it sits.',
      'Yes — dynamics lose the slap': 'A dynamic can serve above or below; judge the model and its position.',
    },
  },
  {
    id: 'dj.place.1',
    page: 'placement',
    prompt: 'One published top mic sits 5–10 cm above the head; another about 41 cm from it. Which is right?',
    options: ['Both are case examples — try one, then the other, and listen', 'The closer one: the nearer mic is the more accurate of the two', 'The farther one: close mics sound thin'],
    correct: 'Both are case examples — try one, then the other, and listen',
    explain: 'Published distances are examples conditioned on the drum, its height and safe clearance — not rules. Nearer raises direct sound but can exaggerate contact; farther integrates the strokes with more room.',
    why: {
      'The closer one: the nearer mic is the more accurate of the two': 'Nearer can exaggerate contact and narrow the balance of strokes. Test it.',
      'The farther one: close mics sound thin': 'Not every close mic sounds thin. Try both, one change at a time.',
    },
  },
  {
    id: 'dj.place.2',
    page: 'placement',
    prompt: 'The top mic gives plenty of slap but little bass. What do you check first?',
    options: ['The top mic’s aim and distance, and whether the opening is clear', 'Add a low mic straight away, whatever the drum is standing on or held by', 'Boost the lows until the bass returns'],
    correct: 'The top mic’s aim and distance, and whether the opening is clear',
    explain: 'Re-aim or back off safely; if needed and possible, try a low mic and a mono blend.',
    why: {
      'Add a low mic straight away, whatever the drum is standing on or held by': 'Only where the opening and the support allow it — and after the top mic has been tried.',
      'Boost the lows until the bass returns': 'Move the mic before processing: position decides what it hears.',
    },
  },
  {
    id: 'dj.place.3',
    page: 'placement',
    prompt: 'The player tilts the drum as they play. What happens to a low mic on a fixed stand?',
    options: ['Its view of the opening changes as the drum moves', 'Nothing — the opening stays in the same place', 'It hears more bass the more the drum tilts'],
    correct: 'Its view of the opening changes as the drum moves',
    explain: 'The player may change tilt or height during performance, changing the opening’s relationship to a fixed low stand. Reposition for reliable coverage, or choose a one-mic approach.',
    why: {
      'Nothing — the opening stays in the same place': 'A tilting drum moves its opening relative to a fixed mic.',
      'It hears more bass the more the drum tilts': 'No fixed rule: the relationship changes, and so does the sound.',
    },
  },
  {
    id: 'dj.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · A low mic stand goes beside a raised djembe. What must its base and cable stay clear of?',
    options: ['The player’s feet and the drum’s support', 'The rope ring, so the drum stays in tune', 'The front of the drum, so it can be seen'],
    correct: 'The player’s feet and the drum’s support',
    explain: 'Keep the lower mic and cable out of foot traffic and from under an unstable instrument; confirm the stand’s stability.',
    why: {
      'The rope ring, so the drum stays in tune': 'Clamp nothing to the ropes, but the base and cable must first stay out of the player’s feet and the support.',
      'The front of the drum, so it can be seen': 'How it looks is not the safety question.',
    },
  },
  {
    id: 'dj.ctx.1',
    page: 'context',
    prompt: 'On a loud stage, should you add a low mic for more bass?',
    options: ['Only if the top mic cannot capture it and feedback margin allows', 'Yes — on a loud stage a second mic helps the djembe cut through the band', 'Yes, and turn its low frequencies up in the wedge'],
    correct: 'Only if the top mic cannot capture it and feedback margin allows',
    explain: 'More open mics and low-frequency gain can challenge usable level. Work with the operator on a stable top mic; add a low mic if the bass cannot be captured otherwise and the margin permits.',
    why: {
      'Yes — on a loud stage a second mic helps the djembe cut through the band': 'Each open mic adds spill and feedback risk. Add it only for a real need.',
      'Yes, and turn its low frequencies up in the wedge': 'More low-frequency monitor level is exactly what eats feedback margin.',
    },
  },
  {
    id: 'dj.ctx.2',
    page: 'context',
    prompt: 'A bottom mic sits near a floor wedge. What else does it hear?',
    options: ['The monitor, as well as the drum’s opening', 'Only the drum — the shell shields it', 'Nothing more, if it is a supercardioid'],
    correct: 'The monitor, as well as the drum’s opening',
    explain: 'A bottom mic near a floor wedge can hear the monitor as well as the drum. Point pickup and rejection with the actual pattern in mind.',
    why: {
      'Only the drum — the shell shields it': 'A low mic beside the drum is open to the stage; the shell does not shield it from a wedge.',
      'Nothing more, if it is a supercardioid': 'A supercardioid has a rear lobe; its rejection depends on where the wedge sits.',
    },
  },
  {
    id: 'dj.ctx.studio',
    page: 'context',
    prompt: 'Solo studio performance, a good room. What could justify a farther top mic?',
    options: ['More of the whole drum and the room, when the room is worth it', 'A farther mic makes the djembe sound louder and fuller in the recording', 'Distance removes the room from the sound'],
    correct: 'More of the whole drum and the room, when the room is worth it',
    explain: 'A stable position farther from the head includes more of the entire drum and the room. The room and other musicians become part of the pickup.',
    why: {
      'A farther mic makes the djembe sound louder and fuller in the recording': 'Farther means less direct sound; distance is for balance, not level.',
      'Distance removes the room from the sound': 'The reverse: the farther the mic, the more room it hears.',
    },
  },
  {
    id: 'dj.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where are the djembe’s tones and slaps struck?',
    options: ['Closer to the edge of the head', 'Right at the centre of the head', 'On the shell below the rope ring'],
    correct: 'Closer to the edge of the head',
    explain: 'Tone and slap are struck closer to the edge; the bass near the centre.',
    why: {
      'Right at the centre of the head': 'That is where the bass is played.',
      'On the shell below the rope ring': 'The shell is not struck; tones and slaps are played on the head.',
    },
  },
  {
    id: 'dj.two.1',
    page: 'twoMic',
    prompt: 'You flip the polarity of mic B. What happens to the arrival-time difference?',
    options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so the two arrivals now line up in time again', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'A 180° electrical polarity reversal does not remove the acoustic travel-time difference or align all frequencies.',
    why: {
      'It drops to zero, so the two arrivals now line up in time again': 'Flipping polarity changes the sign, not when the sound arrives.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  },
  {
    id: 'dj.two.2',
    page: 'twoMic',
    prompt: 'The low mic hears a stroke 1 ms after the top mic. Summed at equal level, same polarity: the first notch (simplified model)?',
    options: ['500 Hz, then 1.5 kHz, 2.5 kHz …', '1 kHz, then 2 kHz, 3 kHz, 4 kHz …', '250 Hz, then 750 Hz, 1.25 kHz …'],
    correct: '500 Hz, then 1.5 kHz, 2.5 kHz …',
    explain: 'The first cancellation is where the delay is half a period: f = 1 ÷ (2 × 0.001 s) = 500 Hz, then odd multiples. Inverted, the notches sit at 0, 1 kHz, 2 kHz … instead.',
    why: {
      '1 kHz, then 2 kHz, 3 kHz, 4 kHz …': 'That is the INVERTED set (whole multiples of 1 ÷ Δt). Same polarity cancels where the delay is half a period: 500 Hz.',
      '250 Hz, then 750 Hz, 1.25 kHz …': 'That needs a 2 ms delay. With 1 ms the first notch is at 1 ÷ (2 × 0.001 s) = 500 Hz.',
    },
  },
  {
    id: 'dj.two.3',
    page: 'twoMic',
    prompt: 'Should the low mic be inverted because it sits below the drum?',
    options: ['Not by rule — compare both states, in mono, on the whole phrase', 'Yes — a mic below a drum is the one to invert, as a rule of thumb', 'Yes, but only when it is closer than the top mic'],
    correct: 'Not by rule — compare both states, in mono, on the whole phrase',
    explain: 'Do not permanently reverse a channel based only on its being below the drum. Move or aim first, compare the switch at actual levels in mono, across bass, tones and slaps.',
    why: {
      'Yes — a mic below a drum is the one to invert, as a rule of thumb': 'There is no such rule. Compare both states by ear.',
      'Yes, but only when it is closer than the top mic': 'Distance sets the delay, not a fixed polarity. Compare both states.',
    },
  },
  {
    id: 'dj.two.4',
    page: 'twoMic',
    prompt: 'With the low mic added, the bass vanishes when the two combine. What do you check first?',
    options: ['Whether each channel alone has body; then position and polarity', 'Turn the low mic up until the bass comes back', 'Invert the top mic, since the top one is usually the one that is wrong'],
    correct: 'Whether each channel alone has body; then position and polarity',
    explain: 'Reposition or re-aim, then compare polarity at actual levels in mono. No inversion is mandatory.',
    why: {
      'Turn the low mic up until the bass comes back': 'More level does not fix a cancellation.',
      'Invert the top mic, since the top one is usually the one that is wrong': 'Neither mic is “usually wrong”. Compare both states at matched level.',
    },
  },
  {
    id: 'k.prac.gain',
    page: 'practice',
    prompt: 'Typical strokes sit well below the overload light, but the strongest bass and slaps light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader well down until the loudest slaps sound clean', 'Ask the player to play the slaps softer during the show'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set gain and any pad using the strongest expected bass and slap, checking both the mic and the input stages. A pad after a distorted capsule cannot undo it.',
    why: {
      'Pull the channel fader well down until the loudest slaps sound clean': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the player to play the slaps softer during the show': 'Set gain for the strongest strokes the player intends to play.',
    },
  },
  {
    id: 'k.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a low mic to a good top mic on a djembe?',
    options: ['Wanted bass the top mic cannot carry, a clear opening, a mono sum that holds', 'Two extra channels give the mix engineer far more options to work with later', 'The djembe needs more level than one mic can give'],
    correct: 'Wanted bass the top mic cannot carry, a clear opening, a mono sum that holds',
    explain: 'Add a lower mic only when its extra control earns a channel, the opening and support allow it, and the blend holds up in mono.',
    why: {
      'Two extra channels give the mix engineer far more options to work with later': 'A second mic adds overlap, spill and feedback risk; it should earn its place.',
      'The djembe needs more level than one mic can give': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'k.mix.1',
    page: 'practice',
    prompt: 'A starting point says “2–4 in above the head at a 40–60° angle”. What else do you need to know?',
    options: ['What the angle is measured from, and whether the hands stay clear', 'The brand of the djembe, so the angle fits it', 'Nothing more — that wording already places the mic exactly where it goes'],
    correct: 'What the angle is measured from, and whether the hands stay clear',
    explain: 'The source does not say what the angle is measured from (this lab measures it from straight down). Clearance from every slap comes first.',
    why: {
      'The brand of the djembe, so the angle fits it': 'Brands do not set placement; the reference and the clearance do.',
      'Nothing more — that wording already places the mic exactly where it goes': 'The angle needs a reference, and clearance is a separate check.',
    },
  },
  {
    id: 'k.mix.2',
    page: 'practice',
    prompt: 'Your floor wedge sits about 110° off a hypercardioid’s front axis. What can you expect?',
    options: ['Strong rejection on paper; less in reality, least in the lows', 'Silence from the wedge, because it sits in the null', 'More pickup than from straight behind, where it rejects the most'],
    correct: 'Strong rejection on paper; less in reality, least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — where the djembe’s bass lives.',
    why: {
      'Silence from the wedge, because it sits in the null': 'A null is infinitely deep only on paper. Real mics reject far less, and least in the lows.',
      'More pickup than from straight behind, where it rejects the most': 'Straight behind, a hypercardioid has a rear lobe; its deepest rejection is off the rear axis.',
    },
  },
  {
    id: 'k.mix.3',
    page: 'practice',
    prompt: 'The top and low mics sound thin together. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning the later mic up until it matches the earlier one'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the later mic up until it matches the earlier one': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  },
];

/* The lesson's troubleshooting table (L34-L40). */
const symptoms: Symptom[] = [
  {
    id: 's.nobass',
    observation: 'Plenty of slap, weak bass',
    firstChecks: 'Does the one upper position represent the bass in the room? Is the opening unobstructed?',
    options: ['The top mic’s position, and whether the opening is clear', 'Boost the lows with EQ until the bass sounds heavy enough', 'Ask the player to play more bass strokes'],
    correct: 'The top mic’s position, and whether the opening is clear',
    explain: 'Re-aim or back off safely; if needed and possible, try a low mic and a mono blend.',
    why: {
      'Boost the lows with EQ until the bass sounds heavy enough': 'Move the mic before processing.',
      'Ask the player to play more bass strokes': 'The part is the player’s. Make the mic represent it.',
    },
  },
  {
    id: 's.toobass',
    observation: 'The bass drowns the articulation',
    firstChecks: 'Is the lower channel excessive, or is the top aimed at one stroke?',
    options: ['The low channel’s level, and the top mic’s aim', 'Turn both channels up so the slaps come through', 'Cut the highs on the top mic'],
    correct: 'The low channel’s level, and the top mic’s aim',
    explain: 'Lower or omit the low mic, re-aim the upper mic, and reassess the complete phrase.',
    why: {
      'Turn both channels up so the slaps come through': 'Level lifts everything together; the balance stays wrong.',
      'Cut the highs on the top mic': 'That would lose more articulation, not less.',
    },
  },
  {
    id: 's.vanish',
    observation: 'The bass vanishes when the two mics combine',
    firstChecks: 'Does each channel alone have body?',
    options: ['Each channel alone; then reposition and compare polarity', 'Invert the low mic, since it sits below the drum', 'Turn the low mic up until the bass returns'],
    correct: 'Each channel alone; then reposition and compare polarity',
    explain: 'Reposition or aim, then compare polarity at actual levels in mono. No mandatory inversion.',
    why: {
      'Invert the low mic, since it sits below the drum': 'Never invert by rule. Compare both states at matched level.',
      'Turn the low mic up until the bass returns': 'More level does not fix a cancellation.',
    },
  },
  {
    id: 's.moves',
    observation: 'The low mic changes sound as the player moves',
    firstChecks: 'Does the opening move relative to the fixed capsule or the floor?',
    options: ['Whether the opening moves against the fixed mic', 'Ask the player to keep the drum perfectly still', 'Tape the drum to its support so it cannot move'],
    correct: 'Whether the opening moves against the fixed mic',
    explain: 'Reposition for reliable coverage or choose a one-mic approach; discuss the stance with the player.',
    why: {
      'Ask the player to keep the drum perfectly still': 'A freely played drum is not immobilised to suit a mic diagram.',
      'Tape the drum to its support so it cannot move': 'Never alter how the player supports the drum to fit a mic.',
    },
  },
  {
    id: 's.feedback',
    observation: 'Feedback or heavy spill live',
    firstChecks: 'Monitor position, polar pattern, number of open mics, routing, gain.',
    options: ['Monitor position, pattern, open mics, routing and gain', 'Turn the wedge up so the player hears the djembe better', 'Add a second low mic for more bass in the PA'],
    correct: 'Monitor position, pattern, open mics, routing and gain',
    explain: 'Work with the operator to change the geometry or omit the optional low mic. Never provoke feedback.',
    why: {
      'Turn the wedge up so the player hears the djembe better': 'More monitor level means less margin before feedback.',
      'Add a second low mic for more bass in the PA': 'Each open mic adds risk; low-frequency gain especially.',
    },
  },
  {
    id: 's.contact',
    observation: 'A mic, stand or cable is in the player’s path',
    firstChecks: 'Full movement and support stability, not just the rest position.',
    options: ['Stop, mute, secure or move it; then check clearance again', 'Keep going carefully, and fix the stand once the song is over', 'Ask the player to play around the mic'],
    correct: 'Stop, mute, secure or move it; then check clearance again',
    explain: 'Clearance comes first: stop before anything moves, and check again during full movement.',
    why: {
      'Keep going carefully, and fix the stand once the song is over': 'Clearance comes first: stop before any mic moves.',
      'Ask the player to play around the mic': 'Never ask the player to sit or stand unnaturally for a mic. Move it.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'k.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic setup in the order you would do them.',
    steps: [
      { text: 'Ask the player: bass, tone and slap, their posture, and how the drum is supported', early: 'Start with the player and the drum.' },
      { text: 'Choose a mic whose pattern, power, size and mount suit the drum and the show', early: 'Choose the mic once you know the part and the posture.' },
      { text: 'Have the player stop; mount the mic; check clearance from hands, knees and feet', early: 'You need a chosen mic before you can mount it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is mounted and its cable connected — with the outputs muted first.' },
      { text: 'Set input gain on the strongest bass and slap, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare positions one change at a time, at matched levels', early: 'Compare only once the level is set safely — and at matched levels, so louder does not win.' },
      { text: 'Keep the simplest setup that works, with safe clearance', early: 'Decide last, after comparing.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it on the strongest bass and slap.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'This input gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point for this kind of mic, measured from the right surface', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, mount and cable stay clear of hands, knees, feet and the drum’s movement', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on djembe', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const BASS_REASON: SetupReason = { id: 'r.bass', label: 'It will give the most bass of any position on the drum', role: 'wrong', feedback: 'Bass emphasis is not a passing reason, and no position always gives the most bass.' };

const setupTasks: SetupTask[] = [
  {
    id: 'k.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A solo studio performance; the djembe stands raised on foam blocks with its opening clear. Phantom power is available.',
    setups: [
      { id: 'a', label: 'One slim condenser above the outer edge, about 41 cm from the head’s centre', ok: true, power: 'phantom', feedback: 'A recommended starting point that hears the whole drum and the room; phantom is available.' },
      { id: 'b', label: 'A compact dynamic close above the head, angled, plus a low mic aimed at the opening', ok: true, power: 'none', feedback: 'A case-example pair — check the blend in mono; dynamics need no phantom.' },
      { id: 'c', label: 'One compact dynamic close above the head, angled, outside the hands', ok: true, power: 'none', feedback: 'One mic first — if it carries enough bass, a second is unnecessary.' },
      { id: 'd', label: 'A mic pushed into the open foot for the bass', ok: false, power: 'none', feedback: 'Never obstruct the opening.' },
      { id: 'e', label: 'A mic over the player’s side of the head, where the slaps land', ok: false, power: 'none', feedback: 'That is inside the hand path: it would be struck.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'In a good room, a farther top mic can integrate the strokes', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point, clearance, and power that matches the mic.',
  },
  {
    id: 'k.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage; the player sits with the djembe on the floor between the knees. The spare inputs have NO phantom power.',
    setups: [
      { id: 'a', label: 'One compact dynamic close above the head, angled, outside the hands', ok: true, power: 'none', feedback: 'A stable directional top mic, outside all motion; a dynamic needs no phantom.' },
      { id: 'b', label: 'A compact hypercardioid dynamic farther above the outer edge', ok: true, power: 'none', feedback: 'A recommended starting point, its narrow pattern helping against spill; no phantom needed.' },
      { id: 'c', label: 'A low mic under the drum for the bass', ok: false, power: 'none', feedback: 'The drum rests on the floor: nothing goes under it.' },
      { id: 'd', label: 'A slim condenser close above the head', ok: false, power: 'phantom', feedback: 'It needs phantom power these inputs lack.' },
      { id: 'e', label: 'A mic clipped to the rope ring', ok: false, power: 'none', feedback: 'Clamp nothing to the ropes; a clip must be made for the drum and approved by its owner.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against stage spill and feedback', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'Two top-mic setups pass. What passes is the reasoning: one mic first, clear of the player, powered by what these inputs can supply.',
  },
];

const predictions: HandLesson['predictions'] = {
  sound: { prompt: 'Before you step through: the hand pushes the head down. Where does the air in the bowl go?', options: ['Down through the waist and out of the foot', 'Up, back out through the head', 'Nowhere — the air stays still'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the air.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the top mic from 5 cm above the head to about 40 cm away. What changes?', options: ['More of the whole drum and the room', 'More slap', 'It depends on this drum and room'], after: 'Farther tends to integrate the strokes with more room — and drums and rooms vary, so “it depends” is fair too.' },
  context: { prompt: 'Where can this mic, aimed at the head, best reject the floor wedge in front?', options: ['Straight behind the mic', 'Toward its rear, off to one side', 'At the sides of the mic'], after: 'Now tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is a djembe?',
    options: ['A single-headed goblet drum, open at the bottom', 'A two-headed drum played with sticks', 'A pair of small drums joined by a block'],
    correct: 'A single-headed goblet drum, open at the bottom',
    explain: 'A djembe is a single-headed goblet-shaped hand drum with an open lower end.',
    why: {
      'A two-headed drum played with sticks': 'A djembe has one head and is played with the hands.',
      'A pair of small drums joined by a block': 'That describes bongos.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What do the ropes on a djembe do?',
    options: ['Pull the head tight: they tune it', 'Hold the foot to the bowl', 'Mute the bass for a dry sound'],
    correct: 'Pull the head tight: they tune it',
    explain: 'Ropes laced between two rings pull the head tight — the tuning. Clamp nothing to them.',
    why: {
      'Hold the foot to the bowl': 'The shell is carved in one piece; the ropes tune the head.',
      'Mute the bass for a dry sound': 'The ropes tension the head; they do not mute it.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Where is a djembe’s bass stroke played?',
    options: ['Near the centre, with the palm and flat fingers', 'Right at the edge, with the fingertips', 'On the rope ring, with the side of the hand'],
    correct: 'Near the centre, with the palm and flat fingers',
    explain: 'The bass is struck near the centre; tone and slap closer to the edge.',
    why: {
      'Right at the edge, with the fingertips': 'That is nearer a slap.',
      'On the rope ring, with the side of the hand': 'The ring is not struck.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Where does a lot of the djembe’s bass leave the drum?',
    options: ['Out of the open foot, at the bottom', 'Through the ropes on the bowl', 'Only up from the head'],
    correct: 'Out of the open foot, at the bottom',
    explain: 'A lot of bass resonates out of the bottom of the drum.',
    why: {
      'Through the ropes on the bowl': 'The ropes tune the head; the bass leaves through the open foot.',
      'Only up from the head': 'The head radiates the slaps and tones; much of the bass leaves at the bottom.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'The djembe rests flat on the floor. Where can a low mic go?',
    options: ['Nowhere under it — keep one good top mic', 'Under the foot, slid in from the side', 'Inside the bowl, through the opening'],
    correct: 'Nowhere under it — keep one good top mic',
    explain: 'Do not place a mic underneath a drum resting on the floor or prop it up; keep one well-placed top mic.',
    why: {
      'Under the foot, slid in from the side': 'That blocks the opening of a resting drum.',
      'Inside the bowl, through the opening': 'Nothing goes into the drum.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your mic is rated to a very high maximum SPL. What does that tell you about sitting beside the djembe through a long soundcheck?',
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe while the drum stays below the mic’s rating', 'It is safe as long as the mic is nearer the drum than you'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe while the drum stays below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is nearer the drum than you': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  },
];

const zoneStart = (id: string) => DJ_ZONES.find((z) => z.id === id)!.start;

export const M05_LESSON: HandLesson = {
  id: 'M05',
  labId: 'drums',
  title: 'Djembe',
  subtitle: 'A goblet drum: one mic above first, a low mic only if it helps',
  noun: { one: 'djembe', many: 'djembes' },
  copy: handCopy(DJ_WORDS),
  model: DJ_MODEL,
  micTypeIds: ['hdDynCard', 'hdDynHyper', 'hdSdc'],
  zones: DJ_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A djembe is a single-headed, goblet-shaped hand drum with an open lower end: a goat-skin head, rope-tuned, on a carved shell that narrows to a waist and flares into a foot.', src: 'MEINL-HDJ500' },
    { title: 'WHERE YOU MEET IT', text: 'In West African music and far beyond it — solo, in groups and in bands, in the studio and on stage. A player may stand, sit with the drum between the knees, hold or tilt it, or use a stand.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Three contrasting sounds: a deep bass, a ringing open tone and a sharp slap — from fat basses to cutting slaps. Whether one mic carries all three is the first question.', src: 'MEINL-HDJ500' },
    { title: 'ITS SIZE', text: 'Heads are commonly about 12–15 in across, on drums about 23–25 in tall. This lab draws a 12½ in head on a drum about 24 in tall.', src: 'WP-DJEMBE' },
  ],
  sound: {
    stages: [
      { title: 'The hand strikes', text: 'The hand strikes the head — the palm and flat fingers near the centre for a bass, closer to the edge for a tone or a slap. That brief contact is where the ATTACK begins.' },
      { title: 'The head is pushed in', text: 'The head bows down into the drum — most at the centre, not at all at the rim: its lowest vibration shape, drawn here many times larger than it really moves. Then it springs back and rings.' },
      { title: 'The air is pushed down', text: 'The head pushes the air in the bowl down through the narrow waist toward the foot. Resting on the floor, the foot’s opening meets the floor.', ported: 'The head pushes the air in the bowl down through the narrow waist and out of the open foot. Raised, the opening is clear of the floor.' },
      { title: 'Sound leaves the drum', text: 'Sound leaves from the head — the slaps and tones — and around the foot, where the opening meets the floor. The air in the bowl sets the deep bass note.', ported: 'Sound leaves from the head — the slaps and tones — and out of the open foot, where a lot of the bass resonates. The air in the bowl sets the deep bass note.' },
    ],
    attack: 'The start of the sound: the hand on the head. A mic close above the head and facing it tends to hear more of the slaps and tones — and can exaggerate contact if it is very close.',
    body: 'The deep bass: the air in the bowl resonating through the waist and the open foot. Its pitch is set by the shell’s size and shape, not the skin’s tension, and a lot of it leaves out of the bottom. Tendencies to check by ear.',
    head: { diameterMm: D.headD.mm, rods: 0, label: '12½ in goat-skin head, seen from above', strikeSrc: 'WP-DJEMBE' },
  },
  setting: {
    items: [
      { id: 'drums', label: 'the djembe (the same drawing as every other page)', short: 'DJEMBE', note: 'Upright on the floor here — or raised on foam blocks so its opening is clear.', prov: { kind: 'sourced', src: 'MEINL-HDJ500', quote: 'Head Diameter: 12.5"' }, tag: 'THE DRUM', scene: 'all' },
      { id: 'player', label: 'the player', short: 'PLAYER', note: 'Hands, wrists, knees, legs, feet — and the drum itself if they tilt it. Nothing of yours goes there, and nothing that could fall or pivot toward them.', prov: { kind: 'illustrative', reason: 'a player behind the drum; no source gives the reach' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'kit', label: 'the drum kit', short: 'DRUM KIT', note: 'A loud neighbour that reaches a distant or low djembe mic.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'SPILL', scene: 'all' },
      { id: 'bass', label: 'the bass amp', short: 'BASS AMP', note: 'Low-frequency spill — especially into a low mic.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'SPILL', scene: 'all' },
      { id: 'perc', label: 'other percussion', short: 'PERCUSSION', note: 'More distance or a lower mic brings in other percussion too.', prov: { kind: 'illustrative', reason: 'a typical percussion setup; no source gives positions' }, tag: 'SPILL', scene: 'all' },
      { id: 'vox', label: 'a vocal mic', short: 'VOCAL MIC', note: 'Another open mic that hears the djembe.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'OPEN MIC', scene: 'all' },
      { id: 'wedge', label: 'the player’s floor wedge', short: 'WEDGE', note: 'In front of the player, facing them. A low mic near it hears the monitor as well as the drum.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'sidefill', label: 'a side fill', short: 'SIDE FILL', note: 'A loud monitor at the side of the stage.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'A live mono PA may need one reliable, focused feed rather than two mics.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a good room a farther mic includes more of the whole drum — and of the room and the floor’s reflection.', prov: { kind: 'illustrative', reason: 'a generic room; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a floor wedge, loud neighbours and the PA. A stable directional top mic first, with the actual monitors and PA routing; a low mic only if the bass cannot be captured otherwise and the feedback margin permits.',
    studio: 'STUDIO: one stable upper or front mic with the whole phrase; a low mic only for clearly useful bass control. The room and the floor’s reflection are part of the sound; two mics need a blend and a mono check.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for a given drum and performance, describe an alternative, and explain what would justify a lower second channel. With a real drum and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'drum', label: 'Drum (head size, height, support)', kind: 'text' },
      { id: 'posture', label: 'Posture', kind: 'choice', choices: ['standing', 'seated, between the knees', 'tilted', 'on a support', 'on a stand'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['compact dynamic', 'small condenser', 'other'] },
      { id: 'pattern', label: 'Pattern', kind: 'text' },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from what', kind: 'text' },
      { id: 'aim', label: 'Aim', kind: 'text' },
      { id: 'notes', label: 'Bass, tone and slap as heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The waist, foot and opening sizes — drawing defaults; the bowl’s depth — a build default for the owner.', dims: ['waistD', 'footD', 'openingD', 'bowlDepth'] },
    { text: 'The rope ring’s size and the lacing pattern — drawing defaults, never stated.', dims: ['ringT', 'ringRise'] },
    { text: 'The raised support’s height — a build default (200 mm), chosen so a mic fits underneath.', dims: ['support'] },
    { text: 'The hands’ envelope — ILLUSTRATIVE, for the owner to approve.', dims: ['handsUp'] },
    { text: 'What a “40–60 degree angle” is measured from is not stated; the lab measures it from straight down. A tilted posture is described, not drawn.', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'wedge', label: 'the player’s floor wedge, in front of the drum, facing them', short: 'WEDGE', p: { x: 1000, y: 0, z: 0 }, lift: 150, faces: { x: -1, y: 0, z: 0 }, note: 'Below and in front of a mic aimed at the head — where an off-axis null can help.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
      { id: 'sidefill', label: 'a side fill at the side of the stage, facing across', short: 'SIDE FILL', p: { x: -250, y: 0, z: -1900 }, lift: 1100, faces: { x: 0, y: 0, z: 1 }, note: 'Off to the side of the mic: one null cannot face every monitor — distance, level and fewer open mics matter too.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. The published examples here are different cases — very close and quite far, top and bottom — not rules: test one mic before adding another. Every drum, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: mic patterns and the two-mic comb as textbook shapes, and head motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  hand: {
    drum: DJEMBE,
    shellLook: 'goblet',
    headLook: 'goat',
    tool: 'hand',
    variantKey: 'SETUP',
    figure: { view: 'side', badge: 'A djembe — a 12½ in goat-skin head on a carved, rope-tuned goblet — seen from the player’s right', label: 'Side view of a djembe standing on the floor: a goat-skin head on a carved wooden bowl, rope tuning laced between two rings, a narrow waist and a flaring foot open at the bottom.' },
    partsBadge: 'A djembe · tap a part to name it',
    partsPrompt: 'Tap any part — or step through PART — to see what it is and what it does. Switch SETUP to raise the drum on foam blocks. There is nothing to answer on this page.',
    partsNote: 'The hands strike the head; the air in the bowl and the open foot carry the deep bass. The next page shows how.',
    soundBadge: 'The order of events, not their speed · head motion drawn much larger than it really is · silent',
    faceLabel: 'the head',
    strikeWord: 'HAND',
    face: { kind: 'rope', lugs: 0 },
    facePoints: [
      { id: 'c', label: 'CENTRE', frac: 0, blurb: 'The exact centre — where the bass is played.' },
      { id: 'h', label: 'HALFWAY', frac: 0.5, blurb: 'Halfway from the centre to the edge.' },
      { id: 'e', label: 'NEAR THE EDGE', frac: 0.82, blurb: 'Closer to the edge — where tones and slaps are played.' },
    ],
    openEnd: { default: false, raised: true },
    strokes: {
      title: 'Bass, tone and slap',
      intro: 'Switch STROKE and watch which of the head’s shapes the spot drives. The bars are physics; the strokes are the player’s.',
      badge: 'A simplified head · where the hand lands, drawn at a typical spot · bars = how strongly that spot drives each shape',
      items: [
        { id: 'bass', label: 'BASS', short: 'BASS', frac: 0.12, tool: 'palm', text: 'The palm and flat fingers near the centre. The deep note itself is the air in the bowl, set by the shell’s size and shape — not the skin’s tension.' },
        { id: 'tone', label: 'TONE', short: 'TONE', frac: 0.82, tool: 'fingers', text: 'Closer to the edge, with most of the fingers and the edge of the palm on the skin: a ringing open tone.' },
        { id: 'slap', label: 'SLAP', short: 'SLAP', frac: 0.82, tool: 'tips', text: 'Closer to the edge, with only the edge of the palm and the fingertips: a sharp, cutting slap.' },
      ],
      note: 'A tone and a slap land in about the same place: what differs is how much of the hand meets the skin — which this simplified head cannot show. Ask the player to play all three.',
    },
    soundReveal: 'The head moving down pushes the air in the bowl down through the waist toward the open foot — that is where a lot of the bass leaves.',
    plan: {
      box: { u0: -2000, u1: 2300, v0: -1400, v1: 1300 },
      things: [
        { id: 'drums', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'player', kind: 'player', u: -460, v: 0, scene: 'all' },
        { id: 'kit', kind: 'kit', u: -1350, v: -700, scene: 'all' },
        { id: 'bass', kind: 'amp', u: -1450, v: 900, face: 0, scene: 'all' },
        { id: 'perc', kind: 'perc', u: -420, v: 820, scene: 'all' },
        { id: 'vox', kind: 'micstand', u: 620, v: -600, scene: 'all' },
        { id: 'wedge', kind: 'wedge', u: 1000, v: 0, face: Math.PI, scene: 'stage' },
        { id: 'sidefill', kind: 'sidefill', u: -250, v: -1150, face: Math.PI / 2, scene: 'stage' },
        { id: 'audience', kind: 'audience', u: 1750, v: 0, scene: 'stage' },
        { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
      ],
      badge: 'The band from above · a typical layout · the player at the left, the audience to the right',
      looking: 'Plan · the band from above · the player behind the djembe',
      prompt: 'Tap anything around the djembe — or step through ITEM — to see what it means for a djembe mic. There is nothing to answer yet.',
      intro: 'The djembe stands in front of the player, with louder neighbours around it. Everything near it is either the player’s space or a source of spill.',
      label: 'The band from above: the djembe in the middle with the player behind it, a drum kit and a bass amp behind the player, other percussion to the player’s right and a vocal mic in front.',
    },
    before: {
      ask: 'Ask for bass, tone, slap and the whole phrase at realistic dynamics, and every posture and movement: standing, sitting with the drum between the knees, holding or tilting it, or a stand. Note whether the opening stays clear and how the drum is supported.',
      asIs: 'Never require the player to sit or stand unnaturally for a mic, alter how they support the drum, prop it precariously or block its opening in the name of a recipe.',
    },
    worked: { default: 'dj.top.near' },
    clearWords: 'Clear of every slap and stroke, the wrists and knees, the feet — and the drum itself if it tilts. Clearance comes first, before any number — and the player stops before a real mic moves.',
    ideas: {
      hdDynCard: 'Ideas to try with this kind of mic: one stable mic above the head, outside the hands — then move it farther back or angle it differently, one change at a time, and decide whether one mic is enough.',
      hdDynHyper: 'Ideas to try with this kind of mic: close above the head for slap and tone, or — with the drum raised — low beside it, aimed at the opening. Its short body fits low positions.',
      hdSdc: 'Ideas to try with this kind of mic: above the outer edge, about 41 cm from the head’s centre, pointing across it — more of the whole drum and the room. Check the bass it already carries.',
    },
    placeLearn: [
      'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic. The two published top positions — very close, and quite far — are different case examples, not rules; the low and under positions only exist when the drum is raised clear of the floor.',
      'Change one variable at a time while the player plays the same full passage. Nearer raises direct sound but can exaggerate contact; backing off in a good room integrates the strokes with more room and more of the band. A fixed angle does not mean a fixed tone across drums and patterns.',
      'Clearance comes first. Stop the player before moving any mic, stand, cable or support. Map the hand, wrist, knee, leg and drum-motion envelope; keep the low mic and cable out of foot traffic and from under an unstable instrument. The grey hatched areas show roughly where to keep clear.',
      'A low mic is a focused supplement, often narrower and with less hand articulation — not a one-mic solution. If there is no safe, repeatable low position, keep one well-placed top or front mic.',
    ],
    context: {
      pose: { ...zoneStart('dj.top.near'), el: -30 },
      looking: 'Side view · a mic close above the head on the audience side, aimed back across it',
      prompt: 'The wedge stays where the player needs it. Tilt the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still faces the head.',
      learn: [
        { title: 'HOW MUCH ROOM', text: 'Studio: one stable upper or front mic with the whole phrase; the room and the floor’s reflection shape it. Live: a directional mic fairly close, outside all hand motion.' },
        { title: 'HOW MANY MICS', text: 'Studio: a low mic only for demonstrably useful bass control. Live: more open mics and low-frequency gain challenge usable level — add the low mic only if the margin permits.' },
        { title: 'WHAT THE PART NEEDS', text: 'An exposed solo djembe might welcome room perspective; a live mono PA might need one reliable, focused feed.' },
        { title: 'MOUNTING', text: 'A freely played drum is not immobilised for a mic diagram. Ask whether a fixed stand stays aligned through the performance, and test the full movement.' },
      ],
      closing: 'Feedback is a loop of microphone, loudspeaker, room and gain. Supercardioid and hypercardioid rear lobes differ from a cardioid’s; a bottom mic near a floor wedge hears the monitor too. Check at the intended level with the operator — never provoke feedback.',
    },
    pairs: [
      {
        id: 'close',
        label: 'Close top and low (raised)',
        blurb: 'A mic close above the head and a low mic aimed at the opening hear different parts of the drum at different times — the drum is raised for this pair.',
        variant: 'raised',
        A: { typeId: 'hdDynHyper', pattern: 'hypercardioid', pose: zoneStart('dj.top.near') },
        B: { typeId: 'hdDynHyper', pattern: 'hypercardioid', pose: zoneStart('dj.bottom.near') },
        source: 'r.head',
      },
      {
        id: 'far',
        label: 'Far top and under (raised)',
        blurb: 'A mic above the outer edge and one under the drum: a longer path for the top mic, a shorter one for the bass below.',
        variant: 'raised',
        A: { typeId: 'hdSdc', pattern: 'cardioid', pose: zoneStart('dj.top.far') },
        B: { typeId: 'hdSdc', pattern: 'cardioid', pose: zoneStart('dj.bottom.under') },
        source: 'r.head',
      },
    ],
    pairLearn: [
      'The upper and lower mics receive different parts of the sound field, at different times and with possibly different pressure directions. Bring up the upper mic alone, then the lower at a musically useful level; test bass, tones and slaps in mono — not just one stroke.',
      'If the blend loses body or changes attack, move or aim one mic, compare the polarity switch, and evaluate again with any other open mics. Never reverse a channel just because it sits below the drum.',
      'What you just saw: sound reaches two mics at different times; summed, the delayed copy cancels where it is half a period late. A 180° polarity flip moves the notches; it does not remove the travel-time difference or align every frequency.',
    ],
    pairWarn: 'The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the two levels, which this model takes from distance alone (1/r) — that does not hold this close to a drumhead, so read the depths as illustrative only. Judge the pair by ear, in mono, at matched levels.',
  },
};

/** Kept for the art and the tests. */
export const DJEMBE_HEAD_Y = HEAD_Y;
