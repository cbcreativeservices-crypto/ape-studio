/**
 * C06b UPRIGHT BASS, BOWED — the lesson's pages as DATA (blueprint §7).
 * The words come from the owner's lesson (docs/labs/miking/source_text/
 * Upright-Bass-Bowed-Miking-Technique.txt, cited "L<n>" in COMMENTS only)
 * with the fixes logged in docs/labs/miking/CORRECTIONS_LOG.md applied:
 * "above the bridge" made concrete and kept outside the bow's sweep (UB-01,
 * UB-04), the section spot taught as a support for the main pickup with no
 * model named (UB-05: one manufacturer's "orchestral spot" wording was not
 * on its page — softened to the practice, not a product).
 *
 * OWNER RULING 2026-10-04 — suggested starting points, never dogma; no
 * source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, clearReason, docReason, gainCheck, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, type Words } from '../shared/bowed/bowedItems.ts';
import { BASS_BOW, BASS_BOW_MODEL } from '../shared/bowed/bass.ts';
import { bassCopy, bassSetting } from '../shared/bowed/bassWords.ts';
import { BASS_BOW_ZONES } from './model.ts';

const W: Words = { noun: 'bass', player: 'bassist', moving: 'the bow' };
const P = 'ubb';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the double bass',
    goal: 'Get to know the upright (double) bass and its bow — what it is, where you meet it bowed, what it does in the music, and its parts — before any microphone. This lesson is the bowed bass; the plucked bass has its own.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The bow grips and releases the string many times a second, and the bridge carries the vibration into the large carved body. The bow sweeps out to both sides of the strings — and the bass is heavy, valuable and easy to knock over.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a bowed string becomes sound — the bow’s grip and slip, the rocking bridge, the top and back — and where the sound leaves the bass. Shown, never played.',
    credit: { scenarios: [`${P}.snd.1`, `${P}.snd.2`, `${P}.snd.3`], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The bow feeds the string for as long as it moves: long notes sustain, and the bow’s grip adds its own rosin and scrape. Low notes, bow noise and body leave from different places — a mic needs the lows, the pitch and just enough bow.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the bowed bass sits — the bassist behind it, the bow’s sweep, the endpin and the feet, the neighbours — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: [`${P}.set.1`, `${P}.set.2`, `${P}.set.3`], note: 'Answer the three checks.' },
    takeaway: 'The bow travels its whole length both ways, out past the bassist’s right side. A mic, its stand and its cable stay outside that whole path — and nowhere a stand could tip onto the bass. Ask the bassist first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the bowed bass by its properties — pattern, power, size and mount — not by its brand, and know what a pickup adds (and does not).',
    credit: { scenarios: [`${P}.mic.1`, `${P}.mic.2`, `${P}.mic.3`, `${P}.mic.4`, `${P}.rec.1`], note: 'Answer the five checks (one reaches back to how the bass sounds).' },
    takeaway: 'An omni hears the whole bass and the room with no proximity lift; a cardioid rejects more room and neighbours; a miniature on the strings below the bridge stays put — clear of the bow. Check the lows, the pitch AND the bow noise.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — out in front of the strings, a little above the bridge, outside the bow’s whole sweep — then compare lower, an f-hole and a section spot.',
    credit: { scenarios: [`${P}.place.1`, `${P}.place.2`, `${P}.place.3`, `${P}.rec.2`], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'Bowed, the front starting point must sit outside the bow’s sweep as well as in front of the strings. Closer to where the bow plays brings more scrape; a broader view integrates the bass with the room.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the loudest neighbour — and know why the bass body reflects it anyway, and what a spot mic is for in a group.',
    credit: { scenarios: [`${P}.ctx.1`, `${P}.ctx.2`, `${P}.ctx.studio`, `${P}.rec.3`], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the kit sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Rejection is weakest in the lows, and the bass body reflects its neighbours into the mic. In a group, a bass spot supports the main pickup — brought in gradually, checked in mono.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a bass spot and a main pair (or a close and a room mic) can thin the low notes together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: [`${P}.two.1`, `${P}.two.2`, `${P}.two.3`, `${P}.two.4`], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the bass at different times: some pitches cancel — and on a bass the lows thin first. Move or rebalance first; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Diagnose the position, the room and the bow’s path before EQ: too much scrape is usually too close to the bow, and a bow touching anything means stop and clear the space.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one bowed-bass mic in the right order, choose and justify a setup for a solo session and an orchestral section, and say what a spot or pickup is for.',
    credit: { scenarios: [`${P}.prac.order`, `${P}.prac.gain`, `${P}.prac.setup1`, `${P}.prac.setup2`, `${P}.prac.3`, `${P}.mix.1`, `${P}.mix.2`, `${P}.mix.3`], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real bass.' },
    takeaway: 'A repeatable perspective over the full dynamic range, the full bow path kept clear, the bass safe from a tipping stand, and a spot or pickup used only for a stated purpose — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: snd L4-L5 · set L5, L49, L63 ·
 * mic L5, L32, L45 · place L7-L8, L29 · ctx L33-L34, L45 · two L36-L37 ·
 * prac / mix L66-L71.
 */
const scenarios: MikingScenario[] = [
  {
    id: `${P}.snd.1`,
    page: 'sound',
    prompt: 'What does the bow do that a plucking finger does not?',
    options: ['It strikes the string once and lets it ring away', 'It keeps feeding the string, so a note can sustain', 'It holds the string still, so only the body sounds'],
    correct: 'It keeps feeding the string, so a note can sustain',
    explain: 'The bow grips the string, lets it slip, and grips again every vibration: it keeps putting energy in, so long notes, crescendos and quiet entrances are all possible.',
    why: {
      'It strikes the string once and lets it ring away': 'That is closer to a pluck. The bow keeps the string going.',
      'It holds the string still, so only the body sounds': 'The string vibrates under the bow; the bow sustains it.',
    },
  },
  {
    id: `${P}.snd.2`,
    page: 'sound',
    prompt: 'Why can a mic very close to where the bow plays sound scratchy?',
    options: ['Bowing makes the strings vibrate too fast for the mic', 'It hears the bow’s grip — rosin and scrape — up close', 'A bowed bass has no low notes, only high noise'],
    correct: 'It hears the bow’s grip — rosin and scrape — up close',
    explain: 'The bow’s grip and release adds friction noise at the strings. Close to the bow, that articulation can dominate; a little farther, or toward the body, it blends with the note.',
    why: {
      'Bowing makes the strings vibrate too fast for the mic': 'The pitch is the same as plucked; the extra is the bow’s friction noise.',
      'A bowed bass has no low notes, only high noise': 'Bowed, the bass keeps its low fundamental — and adds bow noise on top.',
    },
  },
  {
    id: `${P}.snd.3`,
    page: 'sound',
    prompt: 'A mic near one f-hole of the bowed bass tends to give…',
    options: ['Only the bow noise, with the low end filtered out', 'More body and output — and maybe one local resonance overstated', 'The whole bass evenly, just as a room mic farther back would hear it'],
    correct: 'More body and output — and maybe one local resonance overstated',
    explain: 'Near an f-hole there is more output and low-mid body; one spot can also overstate a local resonance or a room mode. It is an option to test, never a must.',
    why: {
      'Only the bow noise, with the low end filtered out': 'The f-hole tends to add body, not remove it.',
      'The whole bass evenly, just as a room mic farther back would hear it': 'Close to one spot, the mic hears that spot. Distance integrates the instrument.',
    },
  },
  hearingCheck(`${P}.set.1`, W),
  {
    id: `${P}.set.2`,
    page: 'setting',
    prompt: 'What must you check before settling on a bowed-bass mic position?',
    options: ['Only where the bow is resting while the bassist waits', 'Only the distance from the bridge to the front of the mic', 'The full bow path: every string, long strokes, tip and frog'],
    correct: 'The full bow path: every string, long strokes, tip and frog',
    explain: 'Ask the bassist to bow every string with full strokes. The mic, its stand and its cable must clear the hair, the frog, the tip and the bowing arm along the whole path.',
    why: {
      'Only where the bow is resting while the bassist waits': 'A resting bow shows none of its path; check the whole stroke.',
      'Only the distance from the bridge to the front of the mic': 'Distance alone says nothing about the bow’s path through that space.',
    },
  },
  {
    id: `${P}.set.3`,
    page: 'setting',
    prompt: 'Before placing a mic, what do you ask the bassist to play?',
    options: ['One long low E, to set the level for the whole session', 'Nothing: a starting point does not depend on the playing', 'Soft and loud bowing, high and low notes, the full bow travel'],
    correct: 'Soft and loud bowing, high and low notes, the full bow travel',
    explain: 'Listen to soft bow starts, sustained notes and the loudest passage; set gain for the peaks without losing the quiet detail — and watch the bow’s whole path.',
    why: {
      'One long low E, to set the level for the whole session': 'One note shows neither the loud peaks nor the bow’s full path.',
      'Nothing: a starting point does not depend on the playing': 'A starting point is where to begin; the playing decides where you end up.',
    },
  },
  {
    id: `${P}.rec.1`,
    page: 'microphone',
    prompt: 'FROM EARLIER · Where do the bowed bass’s low notes, bow noise and body come from?',
    options: ['All from one spot, the bridge, where the whole sound begins and then leaves the bass', 'Only from the f-holes, which work like a loudspeaker', 'Different places: the strings and bow, the bridge, the body, the f-holes'],
    correct: 'Different places: the strings and bow, the bridge, the body, the f-holes',
    explain: 'The bow’s noise starts at the strings, the low fundamentals and body leave from the whole instrument and the f-holes — which is why a mic’s position changes the balance so much.',
    why: {
      'All from one spot, the bridge, where the whole sound begins and then leaves the bass': 'The bridge passes the vibration on; the sound leaves from the whole body.',
      'Only from the f-holes, which work like a loudspeaker': 'The f-holes add body; the plates radiate most of the sound.',
    },
  },
  {
    id: `${P}.mic.1`,
    page: 'microphone',
    prompt: 'A good, quiet room and a solo bowed bass. Why might you try an omni?',
    options: ['An omni rejects the room better than a cardioid does', 'An omni ignores the bow noise and hears only the body', 'The whole bass and the room, with no proximity lift'],
    correct: 'The whole bass and the room, with no proximity lift',
    explain: 'An omni can capture the whole instrument and the room without a directional mic’s close-up bass rise; a cardioid reduces unwanted room and neighbours. The room decides.',
    why: {
      'An omni rejects the room better than a cardioid does': 'An omni hears more of the room, not less.',
      'An omni ignores the bow noise and hears only the body': 'A pattern does not separate bow from body; position does.',
    },
  },
  {
    id: `${P}.mic.2`,
    page: 'microphone',
    prompt: 'Why might a miniature on the strings below the bridge suit a bowed bass?',
    options: ['It moves with the bass, below the bridge where the bow does not play', 'Its clip stops it from hearing the rest of the orchestra and the hall around it', 'It needs no phantom power, so a plain line input will do'],
    correct: 'It moves with the bass, below the bridge where the bow does not play',
    explain: 'A clip made for the bass grips the two outer strings below the bridge — on the tailpiece side, away from the bow — and carries the capsule with the instrument. Its view is more local.',
    why: {
      'Its clip stops it from hearing the rest of the orchestra and the hall around it': 'A clip is a mount, not a pattern: the mic still hears its neighbours.',
      'It needs no phantom power, so a plain line input will do': 'A miniature condenser needs phantom power, through its adapter.',
    },
  },
  {
    id: `${P}.mic.3`,
    page: 'microphone',
    prompt: 'Is a large-diaphragm mic automatically better for a bowed bass’s lows?',
    options: ['Yes: only a large diaphragm can capture a low E at full strength', 'No: check the actual mic’s specifications and its position', 'Yes, as long as it is placed at an f-hole'],
    correct: 'No: check the actual mic’s specifications and its position',
    explain: 'Diaphragm size does not decide low-frequency capture. The mic’s actual response, its pattern and where it sits do — check them, then listen.',
    why: {
      'Yes: only a large diaphragm can capture a low E at full strength': 'Small mics can reach the low E too; check the real specifications.',
      'Yes, as long as it is placed at an f-hole': 'An f-hole adds body to any mic; it does not make size the deciding factor.',
    },
  },
  {
    id: `${P}.mic.4`,
    page: 'microphone',
    prompt: 'A pickup is installed. What does it add to a bowed bass on a loud stage?',
    options: ['A second microphone that hears only the bow', 'A separate electrical path for level; its tone depends on its design', 'Nothing: a pickup only responds to plucked notes, so it stays silent while the bow plays'],
    correct: 'A separate electrical path for level; its tone depends on its design',
    explain: 'A pickup can carry level on a loud stage; its tone, its response to the bow and the preamp it needs depend on its design. Keep it on its own channel and compare it with the mic.',
    why: {
      'A second microphone that hears only the bow': 'A pickup senses the vibration; it is not a microphone.',
      'Nothing: a pickup only responds to plucked notes, so it stays silent while the bow plays': 'Pickups respond to bowing too — check how this one sounds.',
    },
  },
  {
    id: `${P}.place.1`,
    page: 'placement',
    prompt: 'The front starting point for a bowed bass adds one thing to the plucked one. What?',
    options: ['It must sit right on the bow’s path, to hear the bow', 'It must sit outside the bow’s whole sweep', 'It must touch the strings, so it moves with them'],
    correct: 'It must sit outside the bow’s whole sweep',
    explain: 'The same 15–30 cm in front, a little above the bridge — but the bow plays right there, sweeping out to both sides. The mic, stand and cable sit outside its whole path.',
    why: {
      'It must sit right on the bow’s path, to hear the bow': 'A mic in the bow’s path will be hit — and would hear far too much scrape.',
      'It must touch the strings, so it moves with them': 'Nothing touches the strings above the bridge; that is where the bow plays.',
    },
  },
  {
    id: `${P}.place.2`,
    page: 'placement',
    prompt: 'The bowed bass sounds scratchy with the mic close to the bowing zone. What do you try?',
    options: ['Move even closer to the bow, to focus on the strings', 'Turn up a high-frequency boost on the channel to balance out the scratch', 'Move toward the body or the bridge’s level, or back a little'],
    correct: 'Move toward the body or the bridge’s level, or back a little',
    explain: 'Too close to the bow, rosin and scrape dominate. Shifting toward the body integrates the note; backing off a little blends the bow with the bass.',
    why: {
      'Move even closer to the bow, to focus on the strings': 'Closer to the bow brings more scrape, not less.',
      'Turn up a high-frequency boost on the channel to balance out the scratch': 'A boost makes the scratch louder. Move the mic first.',
    },
  },
  {
    id: `${P}.place.3`,
    page: 'placement',
    prompt: 'An orchestral bass section. What is a section spot for?',
    options: ['One close mic on each bass, mixed up as the main sound of the section', 'A support for the main pickup — the section, not one player', 'Replacing the main pair for the whole low end'],
    correct: 'A support for the main pickup — the section, not one player',
    explain: 'First balance the section in the main mics and the hall. A spot (or a few) on stands in front of the section adds pitch or articulation if needed — brought in gradually and checked in mono.',
    why: {
      'One close mic on each bass, mixed up as the main sound of the section': 'Spots are support tools, not automatically one per player.',
      'Replacing the main pair for the whole low end': 'The main pair may already carry the low end in the hall.',
    },
  },
  {
    id: `${P}.rec.2`,
    page: 'placement',
    prompt: 'FROM EARLIER · What must a bowed-bass mic, its stand and its cable stay clear of?',
    options: ['The front of the bass, so the audience can see it clearly', 'Only the bridge itself; the rest of the space is open', 'The bow’s whole path, the bowing arm, the endpin and the feet'],
    correct: 'The bow’s whole path, the bowing arm, the endpin and the feet',
    explain: 'Clearance comes first: the bow’s hair, frog and tip through every stroke, the bowing arm, the floor around the endpin — and a stand placed so it cannot fall onto the bass.',
    why: {
      'The front of the bass, so the audience can see it clearly': 'In front is where a stand mic usually goes — outside the bow’s path.',
      'Only the bridge itself; the rest of the space is open': 'The bow sweeps far beyond the bridge; check its whole path.',
    },
  },
  {
    id: `${P}.ctx.1`,
    page: 'context',
    prompt: 'You aim a directional bass mic away from the drums, and the kit is still loud in it. Why?',
    options: ['The mic is faulty: aiming away removes the kit completely', 'The bass body reflects the kit back into the mic’s front', 'The bow’s noise is masking the mic’s rejection'],
    correct: 'The bass body reflects the kit back into the mic’s front',
    explain: 'The bass’s large surface reflects drum and PA sound toward the front of a mic aimed away from them. If the pattern alone fails, move the players or the mic.',
    why: {
      'The mic is faulty: aiming away removes the kit completely': 'Rejection is partial — least in the lows — and reflections arrive from the front.',
      'The bow’s noise is masking the mic’s rejection': 'Bow noise does not change a pattern; the kit arrives by reflection.',
    },
  },
  {
    id: `${P}.ctx.2`,
    page: 'context',
    prompt: 'A bass spot in a chamber group. How do you bring it into the mix?',
    options: ['Up to full level first, then lower the main pair to match', 'Only with the polarity flipped, so that it cannot comb against the pair', 'Gradually, under the main pair — checking mono and the image'],
    correct: 'Gradually, under the main pair — checking mono and the image',
    explain: 'The spot also hears the other players and the room. Bring it in gradually, listen in mono for combing, and check that the bass does not jump out of its place in the image.',
    why: {
      'Up to full level first, then lower the main pair to match': 'The main pair carries the group; the spot only supports it.',
      'Only with the polarity flipped, so that it cannot comb against the pair': 'Polarity cannot remove a delay. Level and position come first.',
    },
  },
  {
    id: `${P}.ctx.studio`,
    page: 'context',
    prompt: 'A good, quiet studio, a solo bowed bass. One mic sounds balanced. What next?',
    options: ['Add an f-hole mic and a bridge mic out of habit', 'Keep it as the reference before adding anything', 'Swap to a closer mic, to get more bow on the record'],
    correct: 'Keep it as the reference before adding anything',
    explain: 'A balanced one-mic sound is the reference. A second mic must add something you can name — body, room — and hold together with the first in mono.',
    why: {
      'Add an f-hole mic and a bridge mic out of habit': 'Do not add mics by rote; compare full phrases first.',
      'Swap to a closer mic, to get more bow on the record': 'Closer brings more scrape; only change a balanced sound for a reason.',
    },
  },
  {
    id: `${P}.rec.3`,
    page: 'context',
    prompt: 'FROM EARLIER · How long can a bowed bass note last?',
    options: ['Only until the first pluck dies away', 'A fixed time set by the string’s length', 'As long as the bow keeps moving'],
    correct: 'As long as the bow keeps moving',
    explain: 'The bow feeds the string every vibration; the note sustains as long as the bow moves and the bassist keeps it going.',
    why: {
      'Only until the first pluck dies away': 'That is a plucked note. Bowed, the note is sustained.',
      'A fixed time set by the string’s length': 'Length sets the pitch; the bow sets how long it lasts.',
    },
  },
  {
    id: `${P}.two.1`,
    page: 'twoMic',
    prompt: 'A bass spot and the main pair: the low notes thin out in the mix. Why?',
    options: ['The main pair inverts the bass on its way there, so it cancels', 'Two mics on one source cancel each other’s low end in the sum', 'They hear each note at different times, so some pitches cancel'],
    correct: 'They hear each note at different times, so some pitches cancel',
    explain: 'The main pair is farther and hears each note later; some pitches arrive out of step and cancel. Solo each, sum in mono, move or rebalance the spot, then test polarity or timing.',
    why: {
      'The main pair inverts the bass on its way there, so it cancels': 'Distance delays a sound; it does not flip its sign.',
      'Two mics on one source cancel each other’s low end in the sum': 'It depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay(`${P}.two.2`),
  matchedLevels(`${P}.two.3`),
  {
    id: `${P}.two.4`,
    page: 'twoMic',
    prompt: 'Must the closer bass spot carry the low-frequency foundation?',
    options: ['Yes: a spot exists only to add the low end the main pair misses', 'Yes, as long as its polarity is flipped', 'No: in the hall the main pair may already carry it'],
    correct: 'No: in the hall the main pair may already carry it',
    explain: 'Do not assume the spot must carry the lows; listen to what the main array already gives, then use the spot for what is missing — often pitch and articulation.',
    why: {
      'Yes: a spot exists only to add the low end the main pair misses': 'A spot adds whatever is missing — often definition, not weight.',
      'Yes, as long as its polarity is flipped': 'Polarity does not decide what a spot is for.',
    },
  },
  gainCheck(`${P}.prac.gain`, W),
  {
    id: `${P}.prac.3`,
    page: 'practice',
    prompt: 'What would justify adding a spot or a pickup to a bowed bass?',
    options: ['Two channels give the mix engineer more options to choose from later on', 'A stated purpose, each path working alone, and the pair holding in mono', 'A bowed bass needs a spot and a pickup together, whatever the room or stage'],
    correct: 'A stated purpose, each path working alone, and the pair holding in mono',
    explain: 'Use a spot or a pickup only for a stated musical and acoustic purpose — level on a loud stage, definition in a section — and check it alone and summed in mono.',
    why: {
      'Two channels give the mix engineer more options to choose from later on': 'More paths add spill and a combining check; a second must earn its place.',
      'A bowed bass needs a spot and a pickup together, whatever the room or stage': 'In a quiet room one mic can be the whole bass.',
    },
  },
  {
    id: `${P}.mix.1`,
    page: 'practice',
    prompt: 'A starting point reads “15–30 cm out in front, just above the bridge”. What is it measured from?',
    options: ['The bridge’s foot, on the top', 'The tip of the bow, resting on the strings', 'The strings just above the bridge'],
    correct: 'The strings just above the bridge',
    explain: 'A distance belongs to the part it names: from the strings above the bridge, from the bridge’s foot and from an f-hole are different numbers for the same spot.',
    why: {
      'The bridge’s foot, on the top': 'That is the under-bridge miniature’s reference, not this one’s.',
      'The tip of the bow, resting on the strings': 'The bow moves; a starting point names a fixed part of the bass.',
    },
  },
  nullOnPaper(`${P}.mix.2`, 'drum kit'),
  removeDelay(`${P}.mix.3`),
];

const symptoms: Symptom[] = [
  {
    id: `${P}.sym.scratch`,
    observation: 'Too much scratch and rosin',
    firstChecks: 'Is the capsule very close to the bowing zone? Shift toward the body or the bridge’s level, or back a little.',
    options: ['Boost the highs so the bow sounds brighter and cleaner', 'Too close to the bow: shift toward the body, or back a little', 'Ask the bassist to bow with less rosin on the hair'],
    correct: 'Too close to the bow: shift toward the body, or back a little',
    explain: 'Close to where the bow plays, the friction noise dominates. Moving toward the body or back a little blends the bow into the note.',
    why: {
      'Boost the highs so the bow sounds brighter and cleaner': 'A boost raises the scratch. Move the mic first.',
      'Ask the bassist to bow with less rosin on the hair': 'The bowing is the bassist’s; the mic’s position is yours to change.',
    },
  },
  {
    id: `${P}.sym.pitch`,
    observation: 'Sustained notes lack pitch',
    firstChecks: 'Is the room or the ensemble masking the harmonics? Adjust the angle or height, or bring a directional spot closer.',
    options: ['Cut the low end on the channel until the pitch comes forward again', 'Swap to the largest mic you have, for clearer notes', 'Room or ensemble masking: adjust angle or height, or a closer spot'],
    correct: 'Room or ensemble masking: adjust angle or height, or a closer spot',
    explain: 'The pitch lives in the harmonics; a reverberant room or loud neighbours mask them. A different angle or height, or a closer directional spot, brings them forward.',
    why: {
      'Cut the low end on the channel until the pitch comes forward again': 'A cut thins the bass; the cause is masking, which position fixes.',
      'Swap to the largest mic you have, for clearer notes': 'A larger mic does not clear up a masked position.',
    },
  },
  {
    id: `${P}.sym.boom`,
    observation: 'One low note booms',
    firstChecks: 'Is the mic on an f-hole, or is it a room mode? Move the mic or the player; compare several notes and the room.',
    options: ['Cut all the low end, so that no note can boom at all', 'An f-hole or a room mode: move mic or player, check several notes', 'Move the mic right up to the f-hole, so the boom is under control'],
    correct: 'An f-hole or a room mode: move mic or player, check several notes',
    explain: 'One booming note can come from a local resonance or from the room. Move the mic or the bass and compare several notes before a large cut that thins every note.',
    why: {
      'Cut all the low end, so that no note can boom at all': 'A broad cut removes the fundamentals the music needs.',
      'Move the mic right up to the f-hole, so the boom is under control': 'Closer to the f-hole usually adds more boom.',
    },
  },
  {
    id: `${P}.sym.section`,
    observation: 'The section spot isolates one player',
    firstChecks: 'Is the spot too close, or poorly aimed? Move it to hear the intended group; lower it in the main-pair mix.',
    options: ['Add one more spot on that player’s neighbour, to balance the two players', 'Too close or poorly aimed: move it to hear the group; lower it', 'Flip the spot’s polarity until the player blends in'],
    correct: 'Too close or poorly aimed: move it to hear the group; lower it',
    explain: 'A section spot should hear the section. Back it off or re-aim it to cover the group, and keep it under the main pair.',
    why: {
      'Add one more spot on that player’s neighbour, to balance the two players': 'More close spots isolate more players; move the one you have.',
      'Flip the spot’s polarity until the player blends in': 'Polarity does not change what the spot hears.',
    },
  },
  hollowSymptom(`${P}.sym.hollow`),
  {
    id: `${P}.sym.touch`,
    observation: 'The bow touches the stand or a cable',
    firstChecks: 'Did the setup skip the full-motion check? Stop, and clear the space with the bassist before continuing.',
    options: ['Stop, and clear the space with the bassist before going on', 'Ask the bassist to shorten their strokes for the session', 'Tape the cable to the bass so the bow rides over it'],
    correct: 'Stop, and clear the space with the bassist before going on',
    explain: 'A bow touching anything means the full-motion check failed. Stop, move the stand or cable outside the bow’s whole path with the bassist, and check again.',
    why: {
      'Ask the bassist to shorten their strokes for the session': 'The bassist plays the music; the setup moves out of the bow’s way.',
      'Tape the cable to the bass so the bow rides over it': 'Nothing is taped to the bass, and the bow must stay clear of it.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: `${P}.prac.order`,
    page: 'practice',
    prompt: 'Tap the steps of a one-mic bowed-bass setup in the order you would do them.',
    steps: [
      { text: 'Ask the bassist: soft and loud bowing, high and low notes, full bow travel', early: 'Start with the player, the music and the bow.' },
      { text: 'Mark a safe zone for a stand or clip, outside the bow’s whole path', early: 'Know where a stand can go safely before choosing one.' },
      { text: 'Choose the mic and a stable stand, or an approved clip', early: 'Choose once you know the sound and the space.' },
      { text: 'With the bassist stopped, place it in front, a little above the bridge', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom power on', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the loudest bowing, keeping the quiet detail', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare lower, an f-hole and a broader view, one change at a time', early: 'Compare only once the level is set safely.' },
      { text: 'Watch full strokes on every string again; secure the stand', early: 'Check the bow’s whole path last, with the mic in its final place.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it. Gain: set it for the loudest bowing, without losing soft entrances.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: `${P}.prac.setup1`,
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a solo bowed bass in a good quiet room. One channel, phantom available.',
    setups: [
      { id: 'a', label: 'Small condenser 15–30 cm in front, a little above the bridge, outside the bow’s sweep', ok: true, power: 'phantom', feedback: 'A recommended starting point: body, pitch and bow together — then compare lower and broader.' },
      { id: 'b', label: 'An omni in front at a moderate distance, for the whole bass and the room', ok: true, power: 'phantom', feedback: 'A fair choice in a good quiet room — no proximity lift, the bow blended in.' },
      { id: 'c', label: 'A mic a few centimetres from the strings where the bow plays', ok: false, power: 'phantom', feedback: 'In the bow’s path: it will be hit, and it hears mostly scrape.' },
      { id: 'd', label: 'A clip pressed onto the bridge for the most definition', ok: false, power: 'phantom', feedback: 'Never on the bridge: it can impede its vibration and risk the instrument.' },
      { id: 'e', label: 'A mic at the f-hole and another at the bridge, out of habit', ok: false, power: 'phantom', feedback: 'Two mics by rote add combing; start from one balanced mic as the reference.' },
    ],
    reasons: [docReason('the strings just above the bridge'), clearReason('the bow’s whole path, the endpin and the feet, where it cannot tip onto the bass'), POWER_REASON, { id: 'r.room', label: 'The good, quiet room is worth hearing', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON('bass'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point from its named part, the bow’s whole path kept clear, and the power the mic needs.',
  },
  {
    id: `${P}.prac.setup2`,
    page: 'practice',
    brief: 'BRIEF 2 · An orchestral concert with a main pair over the orchestra. The bass section needs a little more definition. One spare channel, phantom available.',
    setups: [
      { id: 'a', label: 'One spot on a stand in front of the section, about a metre out, aimed at the basses', ok: true, power: 'phantom', feedback: 'A sound support: it hears the section, brought in gradually under the main pair.' },
      { id: 'b', label: 'One spot slightly higher and farther, covering the whole section', ok: true, power: 'phantom', feedback: 'A fair alternative: a broader view of the section, checked in mono against the main pair.' },
      { id: 'c', label: 'A close clip on the front bass only, as the section’s sound', ok: false, power: 'phantom', feedback: 'A section spot should hear the section, not one player.' },
      { id: 'd', label: 'A spot inside the bows’ path, as close as possible to the strings', ok: false, power: 'phantom', feedback: 'Never in a bow’s path; and the spot is for the section, not one string.' },
      { id: 'e', label: 'The spot at full level, the main pair lowered to match', ok: false, power: 'phantom', feedback: 'The main pair carries the orchestra; the spot only supports it.' },
    ],
    reasons: [docReason('the strings above the bridge, at the section'), clearReason('the bows, the endpins and the players'), POWER_REASON, { id: 'r.mono', label: 'Brought in gradually and checked in mono against the main pair', role: 'optional', feedback: 'A fair concert reason.' }, BRAND_REASON('bass'), { id: 'r.polarity', label: 'Flip the spot’s polarity: that always fixes the blend', role: 'wrong', feedback: 'Polarity is a check after placement and balance; it cannot align every frequency.' }],
    explain: 'Two plans pass. What passes is the reasoning: a spot that hears the section, kept out of every bow’s path, brought in under the main pair — and the power the mic needs.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: while the bow moves, what does the string do?', options: ['It is struck once, then rings', 'It is gripped and released, again and again', 'It is held still'], after: 'Now STEP through (or PLAY ONCE) and watch the bow, the string, the bridge and the top.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the front mic closer to where the bow plays. What changes?', options: ['More bow scrape', 'More body', 'It depends on this bass'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The drum kit sits off to the bassist’s right. Will aiming the mic away remove it?', options: ['Yes, completely', 'Partly — least in the lows', 'No difference at all'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Which part should never have a mic or clip clamped to it?',
    options: ['The two outer strings below the bridge', 'A stable stand in front of the bass', 'The bridge'],
    correct: 'The bridge',
    explain: 'Clamping the bridge can impede its vibration. A clip made for the bass grips the strings below it instead.',
    why: {
      'The two outer strings below the bridge': 'That is where a bass clip is made to attach — with the owner’s agreement.',
      'A stable stand in front of the bass': 'A stand in front is fine, outside the bow’s path.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'Where does the bow cross the strings?',
    options: ['A little above the bridge, toward the fingerboard', 'Right on top of the bridge itself, where the strings cross it', 'Below the bridge, between the bridge and the tailpiece'],
    correct: 'A little above the bridge, toward the fingerboard',
    explain: 'The bow plays a few centimetres up from the bridge — right where a front mic looks, so the mic must sit outside its sweep.',
    why: {
      'Right on top of the bridge itself, where the strings cross it': 'The bow plays on the strings, a little above the bridge.',
      'Below the bridge, between the bridge and the tailpiece': 'Below the bridge is where a clip can sit — away from the bow.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'What keeps a bowed note sounding?',
    options: ['The bow, gripping and releasing the string', 'The body, storing the energy of the first pluck', 'The f-holes, pumping air in and out'],
    correct: 'The bow, gripping and releasing the string',
    explain: 'The bow feeds the string every vibration; the note lasts as long as the bow moves.',
    why: {
      'The body, storing the energy of the first pluck': 'A pluck dies away; the bow keeps the string going.',
      'The f-holes, pumping air in and out': 'The f-holes radiate; the bow drives.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A mic very close to the bowing zone tends to hear…',
    options: ['A lot of scrape and rosin noise', 'Only the lowest fundamental', 'Nothing of the bow at all, only the note'],
    correct: 'A lot of scrape and rosin noise',
    explain: 'Close to the bow, its friction noise can dominate; farther away it blends with the note.',
    why: {
      'Only the lowest fundamental': 'Close to the bow, the highs of its friction stand out.',
      'Nothing of the bow at all, only the note': 'Close to the bow, the bow is loud.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a bowed-bass mic, stand and cable stay clear of?',
    options: ['The bow’s whole path, the endpin, and a tipping stand’s reach', 'Only the bow, in the place it rests between pieces', 'Only the audience’s view of the bassist and the bass'],
    correct: 'The bow’s whole path, the endpin, and a tipping stand’s reach',
    explain: 'Check full strokes on every string. Keep stands out of the bow’s path, away from the endpin and the feet, and never where a falling stand could reach the bass.',
    why: {
      'Only the bow, in the place it rests between pieces': 'The bow moves far beyond where it rests.',
      'Only the audience’s view of the bassist and the bass': 'Looks matter less than safety.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = BASS_BOW.floorY;
const wedges: Wedge[] = [
  {
    id: 'drums',
    label: 'the drum kit, off to the bassist’s right',
    short: 'DRUMS',
    p: { x: -100, y: floorY, z: 1550 },
    lift: 650,
    faces: { x: 0, y: -1, z: 0 },
    note: 'Beside the bassist, loud — and the bass body reflects it into a mic aimed away from it.',
    prov: { kind: 'illustrative', reason: 'a typical small-band layout; no source gives the position' },
    glyph: 'none',
  },
  {
    id: 'wedge',
    label: 'the bassist’s floor wedge, in front, facing back',
    short: 'WEDGE',
    p: { x: 1500, y: floorY, z: 150 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'In front, facing back at the bassist: point it so it does not drive the bass body or the mic.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
];

export const C06B_LESSON: Lesson = {
  id: 'C06b',
  labId: 'strings',
  title: 'Upright Bass, Bowed',
  subtitle: 'In front outside the bow’s sweep, an f-hole, a clip, or a section spot',
  noun: { one: 'bass', many: 'basses' },
  model: BASS_BOW_MODEL,
  micTypeIds: ['sdcCard', 'strMini'],
  zones: BASS_BOW_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The upright (double) bass, played with a bow (arco) — the same instrument as the plucked lesson, a second way of playing it. Four strings — E, A, D, G — over a tall bridge; the bow’s horsehair, rosined, grips the strings.', src: 'DPA-DB' },
    { title: 'WHERE YOU MEET IT', text: 'The orchestra above all — a section of basses — and chamber music, solo recitals, film sessions, and bowed passages in jazz and folk. This lesson covers one bowed bass and a section spot.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It sustains the foundation: long notes, quiet entrances, crescendos, string crossings. The mic must carry the low body, the pitch and just enough of the bow — across the whole dynamic range.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'This lab draws a large bass — about 1.16 m of body and nearly 2 m tall — on its endpin, with a bow whose hair is about 49 cm long. Its lowest open string, the E, is about 41 Hz.', src: 'MET-EBERLE' },
  ],
  sound: {
    stages: [
      { title: 'The bow grips the string', text: 'Rosined hair grips the string and drags it sideways as the bow moves — a few millimetres, drawn larger here than it really moves.' },
      { title: 'It slips, then grips again', text: 'The string snaps back, slipping under the hair, then is caught again — once every vibration. As long as the bow moves, the note sustains; the grip adds its own scrape.' },
      { title: 'The string rocks the bridge', text: 'The vibrating string pulls the top of the tall bridge from side to side, and the bridge rocks on its two feet.' },
      { title: 'The bridge drives the top', text: 'Under one foot the top moves in and out; under the other, the soundpost holds the top nearly still and passes the motion to the back. The large top, the back and the air inside all vibrate.' },
      { title: 'Sound leaves the body', text: 'Low fundamentals, harmonics, bow noise and the room come from different places: the whole body radiates, air breathes through the f-holes, and the bow’s scrape starts at the strings. Where the mic sits decides the balance.' },
    ],
    attack: 'The bow’s articulation: the grip, the rosin and the scrape, strongest at the strings where the bow plays. A mic close to the bowing zone hears much more of it.',
    body: 'The sustained note: the strings, the bridge, the body and the air inside, fed by the bow — low fundamentals and harmonics leaving from the whole instrument and the f-holes. Both are tendencies; basses vary.',
    head: { diameterMm: 0, rods: 0, label: 'the E string', strikeSrc: 'PHYS-ET' },
  },
  setting: {
    items: bassSetting('bow'),
    stage: 'LIVE: the bowed bass shares the stage with wedges, the PA and loud neighbours. A stand mic with comfortable bow clearance may be enough when quiet; on a loud stage, a clip below the bridge or a pickup gives more control — each on its own channel.',
    studio: 'STUDIO: no wedges, a room to hear. Solo, one balanced mic is the reference; in a group or an orchestra, the main pickup carries the section and a spot only supports it.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic bowed-bass setup for a solo session and a section spot for an orchestra, and say what a spot or pickup is for. With a real bass and the bassist’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'role', label: 'What the mic is', kind: 'choice', choices: ['solo capture', 'chamber spot', 'section support', 'live reinforcement'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'miniature on a clip', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from which part — and the bow’s clearance', kind: 'text' },
      { id: 'notes', label: 'What you heard: pitch, body, scrape, room (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The bass’s height above the floor (endpin 250 mm, a 15° lean back; the proposal’s 20° turn left out) — drawing defaults — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The bass is drawn at one large museum instrument’s size (body 1162 mm, string length 1115); modern basses are often smaller. Stop (665), bridge height (160), arching and the fingerboard are drawing defaults.', dims: [] },
    { text: 'The bow’s sweep: ±25° about the bowing point, the hair’s length plus 20 mm, at three positions of the stroke (tip, middle, frog); the bow arm, the bow hand and the left hand — illustrative.', dims: [] },
    { text: '“Just above the bridge” read as 6–15 cm up the strings, 15–30 cm out in front; the f-hole’s “a few inches” as 5–10 cm; the clip distances; the section spot’s 70–110 cm out and 1–1.5 m high — drawing defaults.', dims: [] },
    { text: 'The miniature’s capsule and gooseneck reach, and the small condenser’s diameter — drawing defaults.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every bass, bassist, bow and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one bassist in a typical stance, the bow’s sweep as a keep-clear area that appears as the mic comes close, mic patterns and the two-mic comb as textbook shapes, and string and body motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the bassist stopped, only with their agreement — outside the bow’s whole path, and never where a stand could fall onto the bass.',
  copy: bassCopy('bow', { worked: 'ub.front', context: 'ub.front', twoA: 'ub.under', twoB: 'ub.spot', prefix: P, studioId: `${P}.ctx.studio` }),
};
