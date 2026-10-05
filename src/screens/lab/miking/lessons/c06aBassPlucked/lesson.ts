/**
 * C06a UPRIGHT BASS, PLUCKED — the lesson's pages as DATA (blueprint §7).
 * The words come from the owner's lesson (docs/labs/miking/source_text/
 * Upright-Bass-Plucked-Miking-Technique.txt, cited "L<n>" in COMMENTS only)
 * with the fixes logged in docs/labs/miking/CORRECTIONS_LOG.md (UB-01 …)
 * applied: "above the bridge" made concrete (UB-01), the under-bridge spot
 * drawn behind the bridge between the strings and the top (UB-02), the old
 * foam-wrapped practice noted but not taught (UB-03).
 *
 * OWNER RULING 2026-10-04 — suggested starting points, never dogma; no
 * source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, POWER_REASON, clearReason, docReason, gainCheck, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, type Words } from '../shared/bowed/bowedItems.ts';
import { BASS_PLUCK, BASS_PLUCK_MODEL } from '../shared/bowed/bass.ts';
import { bassCopy, bassSetting } from '../shared/bowed/bassWords.ts';
import { BASS_PLUCK_ZONES } from './model.ts';

const W: Words = { noun: 'bass', player: 'bassist', moving: 'the plucking hand' };
const P = 'ubp';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the double bass',
    goal: 'Get to know the upright (double) bass — what it is, where you meet it, what it does in the music, and its parts — before any microphone. This lesson is the plucked bass; the bowed bass has its own.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The fingers pull the strings and let go; the bridge carries their vibration into the large carved body. The bassist stands behind it, and the bass is heavy, valuable and easy to knock over.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a plucked string becomes sound — the pull and release, the rocking bridge, the top and back — and where the sound leaves the bass. Shown, never played.',
    credit: { scenarios: [`${P}.snd.1`, `${P}.snd.2`, `${P}.snd.3`], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The pluck is the attack; the low fundamental, the harmonics and the body ring on and die away. Low notes, finger attack and body leave from different places — a mic needs both the lows and the detail.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the bass sits — the bassist behind it, the hands, the endpin and the feet, the drums and the piano — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: [`${P}.set.1`, `${P}.set.2`, `${P}.set.3`], note: 'Answer the three checks.' },
    takeaway: 'The hands work the strings above the bridge and along the neck; the endpin and the feet share the floor, and a stand must never be able to tip onto the bass. Ask the bassist first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the plucked bass by its properties — pattern, power, size and mount — not by its brand, and know what a pickup is (and is not).',
    credit: { scenarios: [`${P}.mic.1`, `${P}.mic.2`, `${P}.mic.3`, `${P}.mic.4`, `${P}.rec.1`], note: 'Answer the five checks (one reaches back to how the bass sounds).' },
    takeaway: 'A stand mic in front gives the natural bass; a miniature on the strings stays put as the bassist moves; a pickup is a separate electrical path, not a microphone. Check the lows AND the detail.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — out in front of the strings, a little above the bridge — then move the mic higher, lower and to an f-hole, and see what changes.',
    credit: { scenarios: [`${P}.place.1`, `${P}.place.2`, `${P}.place.3`, `${P}.rec.2`], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: '“Just above the bridge” means out in front of the strings, a little higher than the bridge — not on it. A stand mic in front and a capsule under the strings are different geometries: their distances are not interchangeable.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the drum kit — and know why the bass body reflects the kit anyway, and what a pickup adds on a loud stage.',
    credit: { scenarios: [`${P}.ctx.1`, `${P}.ctx.2`, `${P}.ctx.studio`, `${P}.rec.3`], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the kit sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Rejection is weakest in the lows, and the bass body reflects the kit into the mic. On a loud stage a pickup carries the low end and the mic adds detail as far as feedback allows — each on its own channel.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a close and a farther mic on one bass can lose body together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: [`${P}.two.1`, `${P}.two.2`, `${P}.two.3`, `${P}.two.4`], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the bass at different times: some pitches cancel — and on a bass the lows thin first. Move or rebalance first; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Diagnose the source, the room and the monitoring before a large low-frequency boost or cut: one boomy note is often the room.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one bass mic in the right order, choose and justify a setup for a studio and a stage, and say what would justify a second path.',
    credit: { scenarios: [`${P}.prac.order`, `${P}.prac.gain`, `${P}.prac.setup1`, `${P}.prac.setup2`, `${P}.prac.3`, `${P}.mix.1`, `${P}.mix.2`, `${P}.mix.3`], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real bass.' },
    takeaway: 'Safe clearance from the hands, the endpin and a tipping stand, correct power and level checks, pattern and pickup reasoning, and an accurate account of polarity versus delay pass — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: snd L4, L6 · set L6, L65 ·
 * mic L9, L29, L35, L36 · place L9, L31 · ctx L32, L35, L37 · two L33, L38 ·
 * prac / mix L7, L35-L38, L65-L71.
 */
const scenarios: MikingScenario[] = [
  {
    id: `${P}.snd.1`,
    page: 'sound',
    prompt: 'A four-string bass’s open E is about 41 Hz. What does that mean for the mic and the channel?',
    options: ['They must keep the lows — and the detail that makes the pitch clear', 'Only the lows matter: a bass mic needs no high frequencies at all', 'Nothing: at 41 Hz a microphone cannot pick up the note, so the channel does not matter'],
    correct: 'They must keep the lows — and the detail that makes the pitch clear',
    explain: 'A bass mic must capture the low notes AND the high-frequency detail: the harmonics, the finger attack and the room define how clearly the pitch is heard.',
    why: {
      'Only the lows matter: a bass mic needs no high frequencies at all': 'The pitch and the pluck live in the harmonics; without them the bass is a blur.',
      'Nothing: at 41 Hz a microphone cannot pick up the note, so the channel does not matter': 'Many mics reach that low; check the actual mic and channel.',
    },
  },
  {
    id: `${P}.snd.2`,
    page: 'sound',
    prompt: 'What happens to a plucked string once the finger lets go?',
    options: ['It swings back and rings, its shape splitting into two corners', 'It stops at once, because nothing keeps pulling it after release', 'It keeps the exact triangle the finger gave it until it is damped'],
    correct: 'It swings back and rings, its shape splitting into two corners',
    explain: 'Released, the pulled triangle splits into two corners that run apart and back; the string rings on, and with nothing to keep it going the note dies away — the body of the sound.',
    why: {
      'It stops at once, because nothing keeps pulling it after release': 'It rings on after release; nothing keeps it going, so it fades — but not at once.',
      'It keeps the exact triangle the finger gave it until it is damped': 'The shape changes at once into two travelling corners; it is the same triangle again only half a cycle later, mirrored.',
    },
  },
  {
    id: `${P}.snd.3`,
    page: 'sound',
    prompt: 'A mic near one f-hole of the bass tends to give…',
    options: ['More level and body — and maybe one local resonance overstated', 'Only the finger attack, with the low end filtered out', 'The whole bass evenly, just as a room mic farther back would hear it'],
    correct: 'More level and body — and maybe one local resonance overstated',
    explain: 'Near an f-hole there is more output and low-mid body; one spot can also overstate a local resonance. A bridge-oriented view includes more pluck definition.',
    why: {
      'Only the finger attack, with the low end filtered out': 'The f-hole tends to add body, not remove it.',
      'The whole bass evenly, just as a room mic farther back would hear it': 'Close to one spot, the mic hears that spot. Distance integrates the instrument.',
    },
  },
  hearingCheck(`${P}.set.1`, W),
  {
    id: `${P}.set.2`,
    page: 'setting',
    prompt: 'Where must a mic stand never go around an upright bass?',
    options: ['Anywhere it could tip onto the bass, or by the endpin and feet', 'In front of the bass, where the audience can see the stand and its cable', 'Beside the bassist’s amp, where the cable is shortest'],
    correct: 'Anywhere it could tip onto the bass, or by the endpin and feet',
    explain: 'A bass is valuable, heavy and unstable if bumped. Keep stands and cables away from the endpin and the feet, and never where a falling stand could reach the instrument.',
    why: {
      'In front of the bass, where the audience can see the stand and its cable': 'In front is where a stand mic usually goes — placed so it cannot fall onto the bass.',
      'Beside the bassist’s amp, where the cable is shortest': 'The cable route matters, but the safety question is what a falling stand could hit.',
    },
  },
  {
    id: `${P}.set.3`,
    page: 'setting',
    prompt: 'Before placing a mic, what do you ask the bassist to play?',
    options: ['Low notes, higher walking lines, accents, soft notes and any slap', 'One long low E, to set the level for the whole show', 'Nothing: a starting point does not depend on what the bassist plays'],
    correct: 'Low notes, higher walking lines, accents, soft notes and any slap',
    explain: 'Set gain for the peaks, not the first gentle note, and listen across the range. Ask about the pickup, the posture, the room and the neighbours too.',
    why: {
      'One long low E, to set the level for the whole show': 'One note shows neither the accents’ peaks nor the higher notes’ detail.',
      'Nothing: a starting point does not depend on what the bassist plays': 'A starting point is where to begin; the playing decides where you end up.',
    },
  },
  {
    id: `${P}.rec.1`,
    page: 'microphone',
    prompt: 'FROM EARLIER · Where do the bass’s low notes, finger sounds and body come from?',
    options: ['Different places: the strings, the bridge, the body, the f-holes', 'All from one spot, the bridge, where the whole sound begins and leaves', 'Only from the f-holes, which work like a loudspeaker'],
    correct: 'Different places: the strings, the bridge, the body, the f-holes',
    explain: 'Low fundamentals, harmonics, fingerboard sounds and the room arise from different places — which is why a mic’s position changes the balance so much.',
    why: {
      'All from one spot, the bridge, where the whole sound begins and leaves': 'The bridge passes the vibration on; the sound leaves from the whole body.',
      'Only from the f-holes, which work like a loudspeaker': 'The f-holes add body; the plates radiate most of the sound.',
    },
  },
  {
    id: `${P}.mic.1`,
    page: 'microphone',
    prompt: 'What is a bass pickup, compared with a microphone?',
    options: ['A separate electrical path — not a mic hearing the air', 'A small microphone hidden inside the bass', 'A microphone with a stronger low end than a stand mic has'],
    correct: 'A separate electrical path — not a mic hearing the air',
    explain: 'A pickup turns the vibration into an electrical signal directly; it does not hear airborne sound. Use the pickup’s own input or preamp requirements, and keep it on its own channel.',
    why: {
      'A small microphone hidden inside the bass': 'A pickup is not a microphone; it senses the vibration, not the air.',
      'A microphone with a stronger low end than a stand mic has': 'It is a different kind of path, not a stronger mic.',
    },
  },
  {
    id: `${P}.mic.2`,
    page: 'microphone',
    prompt: 'A directional mic very close to the bass sounds boomy. A likely reason?',
    options: ['Proximity effect: a directional mic up close lifts the lows', 'The omni pattern is collecting the room’s bass from all around it', 'The strings are too thick for the mic to hear'],
    correct: 'Proximity effect: a directional mic up close lifts the lows',
    explain: 'A directional mic develops a bass boost very close; an omni has different proximity behaviour and hears more room. Back off or change the angle before a big cut.',
    why: {
      'The omni pattern is collecting the room’s bass from all around it': 'The mic in question is directional. Close-up lift is proximity effect.',
      'The strings are too thick for the mic to hear': 'String size is not the issue; the close distance is.',
    },
  },
  {
    id: `${P}.mic.3`,
    page: 'microphone',
    prompt: 'Why might a miniature on the strings below the bridge suit a moving bassist?',
    options: ['It moves with the bass, keeping one distance from the strings', 'Its clip stops it from hearing the drums and the rest of the stage', 'It needs no phantom power, so a plain line input will do'],
    correct: 'It moves with the bass, keeping one distance from the strings',
    explain: 'A clip made for the bass grips the two outer strings below the bridge and carries the capsule with the instrument. It still hears the stage, and its close view is more local.',
    why: {
      'Its clip stops it from hearing the drums and the rest of the stage': 'A clip is a mount, not a pattern: the mic still hears the stage.',
      'It needs no phantom power, so a plain line input will do': 'A miniature condenser needs phantom power, through its adapter.',
    },
  },
  {
    id: `${P}.mic.4`,
    page: 'microphone',
    prompt: 'Is a large-diaphragm mic automatically better for a bass’s lows?',
    options: ['No: check the actual mic’s specifications and its position', 'Yes: only a large diaphragm can capture a low E at full strength', 'Yes, as long as it is placed at an f-hole'],
    correct: 'No: check the actual mic’s specifications and its position',
    explain: 'Diaphragm size does not decide low-frequency capture. The mic’s actual response, its pattern and where it sits do — check them, then listen.',
    why: {
      'Yes: only a large diaphragm can capture a low E at full strength': 'Small mics can reach the low E too; check the real specifications.',
      'Yes, as long as it is placed at an f-hole': 'An f-hole adds body to any mic; it does not make size the deciding factor.',
    },
  },
  {
    id: `${P}.place.1`,
    page: 'placement',
    prompt: 'A starting point says “15–30 cm out in front, just above the bridge”. Where is the mic?',
    options: ['In front of the strings, a little higher than the bridge', 'Clipped onto the bridge, at its top edge', 'Under the strings, in the gap between the bridge and the arched top'],
    correct: 'In front of the strings, a little higher than the bridge',
    explain: '“Above the bridge” is a height on the instrument’s face — a little up the strings from the bridge — with the mic 15–30 cm out in front. Nothing goes on the bridge.',
    why: {
      'Clipped onto the bridge, at its top edge': 'Nothing clips to the bridge: it can damp its vibration.',
      'Under the strings, in the gap between the bridge and the arched top': 'That is a different geometry — a capsule mounted on the strings — with distances of its own.',
    },
  },
  {
    id: `${P}.place.2`,
    page: 'placement',
    prompt: 'You move the mic a little higher, toward the fingerboard. What tends to change?',
    options: ['More finger attack and pitch definition; less body', 'More low end, because the strings are longer there', 'Nothing: the height along the strings makes no difference'],
    correct: 'More finger attack and pitch definition; less body',
    explain: 'Toward the fingerboard tends to bring the fingers and the pitch; too localised and the body thins. Compare it with a lower, topward view.',
    why: {
      'More low end, because the strings are longer there': 'Higher tends toward attack, not more low end.',
      'Nothing: the height along the strings makes no difference': 'Height changes the balance of attack and body — try it.',
    },
  },
  {
    id: `${P}.place.3`,
    page: 'placement',
    prompt: 'A stand mic 20 cm in front and a capsule under the strings at 20 cm from the bridge’s foot: the same position?',
    options: ['No: different geometries — their distances are not interchangeable', 'Yes: 20 cm is 20 cm, whichever mount holds the mic or part it is measured from', 'Yes, as long as both are aimed at the bridge'],
    correct: 'No: different geometries — their distances are not interchangeable',
    explain: 'A stand mic in front of the strings and a capsule mounted under them are different places measured from different parts. Choose one, then audition the other.',
    why: {
      'Yes: 20 cm is 20 cm, whichever mount holds the mic or part it is measured from': 'Same number, different reference and place.',
      'Yes, as long as both are aimed at the bridge': 'Aim is a separate check; the positions still differ.',
    },
  },
  {
    id: `${P}.rec.2`,
    page: 'placement',
    prompt: 'FROM EARLIER · What must a bass mic, its stand and its cable stay clear of?',
    options: ['The hands, the endpin and the feet — and a tipping stand’s reach', 'The front of the bass, so the audience can see the instrument clearly', 'The piano, so the pianist can see the bassist'],
    correct: 'The hands, the endpin and the feet — and a tipping stand’s reach',
    explain: 'Clearance comes first: the plucking hand above the bridge, the left hand along the neck, the floor around the endpin — and a stand placed so it cannot fall onto the bass.',
    why: {
      'The front of the bass, so the audience can see the instrument clearly': 'In front is where a stand mic usually goes — placed safely.',
      'The piano, so the pianist can see the bassist': 'Sight lines matter, but safety is about the hands, the floor and a falling stand.',
    },
  },
  {
    id: `${P}.ctx.1`,
    page: 'context',
    prompt: 'You aim a directional bass mic away from the drums, and the kit is still loud in it. Why?',
    options: ['The bass body reflects the kit back into the mic’s front', 'The mic is faulty: aiming away removes the kit completely', 'The bass is too quiet, so the mic has stopped working'],
    correct: 'The bass body reflects the kit back into the mic’s front',
    explain: 'The bass’s large surface reflects drum and PA sound toward the front of a mic aimed away from them. If the pattern alone fails, move the bassist, the drummer, the amp or the mic.',
    why: {
      'The mic is faulty: aiming away removes the kit completely': 'Rejection is partial — least in the lows — and reflections arrive from the front.',
      'The bass is too quiet, so the mic has stopped working': 'The mic works; the kit reaches it by reflection and through its pattern.',
    },
  },
  {
    id: `${P}.ctx.2`,
    page: 'context',
    prompt: 'On a loud stage with a pickup installed, what is a common plan?',
    options: ['Pickup for the low end; the mic for detail, as feedback allows', 'The mic alone, turned up until it is as loud as the rest of the band', 'Pickup and mic summed onto one channel to save inputs'],
    correct: 'Pickup for the low end; the mic for detail, as feedback allows',
    explain: 'The pickup often carries the dependable low-frequency main path; the mic adds acoustic detail as far as gain before feedback allows. Keep them on separate channels so the mic can come down without losing the bass.',
    why: {
      'The mic alone, turned up until it is as loud as the rest of the band': 'On a loud stage a mic alone may not give enough level before feedback.',
      'Pickup and mic summed onto one channel to save inputs': 'Separate channels let the engineer reduce a feeding-back mic without losing the whole bass.',
    },
  },
  {
    id: `${P}.ctx.studio`,
    page: 'context',
    prompt: 'A good, isolated studio room, a natural jazz bass. Why might you try an omni?',
    options: ['A broad picture of the whole bass and the room, with no proximity lift', 'An omni rejects the room’s sound better than a cardioid aimed at the bass', 'Omnis only work on bass, so there is no other choice'],
    correct: 'A broad picture of the whole bass and the room, with no proximity lift',
    explain: 'In a favourable, isolated room an omni can capture the whole instrument broadly; a directional mic helps when isolation is needed. Check the room’s low-frequency decay too.',
    why: {
      'An omni rejects the room’s sound better than a cardioid aimed at the bass': 'An omni hears more of the room, not less.',
      'Omnis only work on bass, so there is no other choice': 'Both kinds work; the room and the isolation decide.',
    },
  },
  {
    id: `${P}.rec.3`,
    page: 'context',
    prompt: 'FROM EARLIER · A four-string bass’s lowest open note is about…',
    options: ['41 Hz, the open E', '65 Hz, like a cello’s C', '196 Hz, like a violin’s G'],
    correct: '41 Hz, the open E',
    explain: 'The open E is about 41 Hz (instruments with an extension or a fifth string go lower) — the region where patterns reject least and rooms boom most.',
    why: {
      '65 Hz, like a cello’s C': 'That is the cello’s lowest; the bass goes lower.',
      '196 Hz, like a violin’s G': 'That is the violin’s lowest; the bass is far lower.',
    },
  },
  {
    id: `${P}.two.1`,
    page: 'twoMic',
    prompt: 'A close and a far mic on the bass: the body disappears in the sum. Why?',
    options: ['They hear each note at different times, so some pitches cancel', 'The far mic inverts the sound on its way there, so it cancels', 'Two mics on one source cancel each other’s low end in the sum, whatever the delay'],
    correct: 'They hear each note at different times, so some pitches cancel',
    explain: 'The farther mic hears each note later; some pitches arrive out of step and cancel. Listen to each alone and in mono, move or rebalance, then compare polarity and timing.',
    why: {
      'The far mic inverts the sound on its way there, so it cancels': 'Distance delays a sound; it does not flip its sign.',
      'Two mics on one source cancel each other’s low end in the sum, whatever the delay': 'It depends on the delay and the levels: some pitches dip, others add.',
    },
  },
  polarityDelay(`${P}.two.2`),
  matchedLevels(`${P}.two.3`),
  {
    id: `${P}.two.4`,
    page: 'twoMic',
    prompt: 'A pickup and a mic on the bass sound hollow together. What do you try first?',
    options: ['Hear each alone, sum in mono, move or rebalance — then polarity', 'Flip the pickup’s polarity and leave it that way for the show', 'Boost the low end on both channels until the body comes back'],
    correct: 'Hear each alone, sum in mono, move or rebalance — then polarity',
    explain: 'The mic hears airborne sound later than the pickup, and electronics add their own phase. Try placement and balance first; a polarity button cannot align every frequency.',
    why: {
      'Flip the pickup’s polarity and leave it that way for the show': 'Polarity is a check, not a cure: it cannot remove a delay.',
      'Boost the low end on both channels until the body comes back': 'EQ cannot undo a cancellation between paths.',
    },
  },
  gainCheck(`${P}.prac.gain`, W),
  {
    id: `${P}.prac.3`,
    page: 'practice',
    prompt: 'What would justify adding a second bass path — a room mic, or a pickup beside the mic?',
    options: ['A clear purpose, each path working alone, and the pair holding in mono', 'Two channels give the mix engineer more options to choose from later on', 'A bass needs a pickup and a mic together, whatever the room or stage'],
    correct: 'A clear purpose, each path working alone, and the pair holding in mono',
    explain: 'A strong single-mic sound is the reference. A second path earns its place by adding something — level on a loud stage, space in a room — and by holding together in mono.',
    why: {
      'Two channels give the mix engineer more options to choose from later on': 'More paths add spill and a combining check; a second must earn its place.',
      'A bass needs a pickup and a mic together, whatever the room or stage': 'In a quiet room one mic can be the whole bass.',
    },
  },
  {
    id: `${P}.mix.1`,
    page: 'practice',
    prompt: 'A starting point reads “about 4–11 cm from the bridge’s foot”. What is it measured from?',
    options: ['The bridge’s foot, on the top', 'The strings just above the bridge', 'The front edge of the fingerboard'],
    correct: 'The bridge’s foot, on the top',
    explain: 'A distance belongs to the part it names: from the bridge’s foot, from the strings above the bridge and from the fingerboard are different numbers for the same spot.',
    why: {
      'The strings just above the bridge': 'That is the stand mic’s reference, not this one’s.',
      'The front edge of the fingerboard': 'The fingerboard is not what this starting point names.',
    },
  },
  nullOnPaper(`${P}.mix.2`, 'drum kit'),
  removeDelay(`${P}.mix.3`),
];

const symptoms: Symptom[] = [
  {
    id: `${P}.sym.boom`,
    observation: 'Low notes boom unevenly',
    firstChecks: 'Is the mic on an f-hole, or is it a room mode? Shift the position and check several notes and the room.',
    options: ['An f-hole or a room mode: shift it, and check several notes', 'Cut all the low end, so no note can boom', 'Move the mic right up to the f-hole for control'],
    correct: 'An f-hole or a room mode: shift it, and check several notes',
    explain: 'A low note can boom from a local resonance or from the room. Move the mic (or the bass) and compare several notes before a large cut that thins every note.',
    why: {
      'Cut all the low end, so no note can boom': 'A broad cut removes the fundamentals the music needs.',
      'Move the mic right up to the f-hole for control': 'Closer to the f-hole usually adds more boom.',
    },
  },
  {
    id: `${P}.sym.attack`,
    observation: 'All finger attack, little body',
    firstChecks: 'Is the capsule too high or too close to the fingerboard? Include the bridge and top, or a broader frontal view.',
    options: ['Too high or close to the fingerboard: include the bridge and top', 'Boost the low end on the channel until the body returns', 'Ask the bassist to pluck more softly for the rest of the set'],
    correct: 'Too high or close to the fingerboard: include the bridge and top',
    explain: 'Near the fingerboard the fingers dominate. Moving down toward the bridge and the top, or back for a broader view, brings the body back.',
    why: {
      'Boost the low end on the channel until the body returns': 'EQ cannot put back what the position misses. Move the mic first.',
      'Ask the bassist to pluck more softly for the rest of the set': 'The playing is the bassist’s; the mic’s position is yours to change.',
    },
  },
  {
    id: `${P}.sym.mud`,
    observation: 'Muddy, with little pitch',
    firstChecks: 'Is the mic extremely close, or the room decaying slowly? Compare distance, pattern and the room position.',
    options: ['Very close, or a slow room: compare distance, pattern, room', 'Boost the high frequencies until the pitch comes through', 'Swap to the largest mic you have, for a clearer low end'],
    correct: 'Very close, or a slow room: compare distance, pattern, room',
    explain: 'Very close directional mics add low end; a slow-decaying room smears the notes. Change the distance, the pattern or the bass’s place in the room first.',
    why: {
      'Boost the high frequencies until the pitch comes through': 'EQ adds noise and spill; the cause is the distance or the room.',
      'Swap to the largest mic you have, for a clearer low end': 'A larger mic does not clear up a muddy position.',
    },
  },
  {
    id: `${P}.sym.drums`,
    observation: 'Drum bleed dominates',
    firstChecks: 'Is the bass reflecting the kit into the mic? Reposition the bass, the drums or the mic; use rejection and a pickup.',
    options: ['Reflections off the bass: move people or mics; aim; add a pickup', 'Turn the bass channel up until the bass covers the drums in that mic', 'Swap to an omni, which hears the drums less'],
    correct: 'Reflections off the bass: move people or mics; aim; add a pickup',
    explain: 'The bass body reflects the kit into the mic. Rearranging the players, aiming the rejection, and using a pickup for the low end all help.',
    why: {
      'Turn the bass channel up until the bass covers the drums in that mic': 'More gain raises the drums in that mic too.',
      'Swap to an omni, which hears the drums less': 'An omni hears everything, the drums included.',
    },
  },
  {
    id: `${P}.sym.feedback`,
    observation: 'Feedback on stage',
    firstChecks: 'Which channel and which speaker excite the body? Lower the offending level and revise the monitor, amp and mic geometry.',
    options: ['Lower the offending level; revise monitor, amp and mic geometry', 'Cut all the low end on both bass channels at once, to stop the ring', 'Boost the bass channel so the note covers the ring'],
    correct: 'Lower the offending level; revise monitor, amp and mic geometry',
    explain: 'A resonant bass can feed back acoustically. Reduce the offending level, change the speaker, bass and mic geometry and the number of open mics, and check the pickup channel separately. Never provoke feedback.',
    why: {
      'Cut all the low end on both bass channels at once, to stop the ring': 'A broad cut removes musical fundamentals; find the narrow problem and its cause.',
      'Boost the bass channel so the note covers the ring': 'More gain feeds the loop. Lower it first.',
    },
  },
  hollowSymptom(`${P}.sym.hollow`),
];

const orderTasks: OrderTask[] = [
  {
    id: `${P}.prac.order`,
    page: 'practice',
    prompt: 'Tap the steps of a one-mic plucked-bass setup in the order you would do them.',
    steps: [
      { text: 'Ask the bassist: lowest notes, posture, pluck style, any pickup; hear the room', early: 'Start with the player, the instrument and the room.' },
      { text: 'Plan a safe stand and cable route, away from the endpin and the feet', early: 'Know where a stand can go safely before choosing one.' },
      { text: 'Choose the mic and a stable stand, or an approved clip', early: 'Choose once you know the sound and the space.' },
      { text: 'With the bassist stopped, place it in front of the strings, just above the bridge', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom power on', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the peaks — accents and slaps — with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare a little higher, lower and an f-hole, one change at a time', early: 'Compare only once the level is set safely.' },
      { text: 'Secure the stand where it cannot tip onto the bass; recheck', early: 'Secure it last, then watch the bassist’s whole motion again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before switching it. Gain: set it for the peaks, not the first gentle note.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: `${P}.prac.setup1`,
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a natural jazz walking bass in a good isolated room. One channel, phantom available.',
    setups: [
      { id: 'a', label: 'Small condenser 15–30 cm in front of the strings, just above the bridge', ok: true, power: 'phantom', feedback: 'A recommended starting point: note, body and finger together — then a little higher and lower.' },
      { id: 'b', label: 'An omni in front at a moderate distance, for the whole bass and the room', ok: true, power: 'phantom', feedback: 'A fair studio choice in a good isolated room — no directional proximity lift.' },
      { id: 'c', label: 'A mic pushed into the f-hole for the most bass', ok: false, power: 'phantom', feedback: 'Nothing goes into an f-hole; and one opening overstates a local resonance.' },
      { id: 'd', label: 'A clip pressed onto the bridge for the most definition', ok: false, power: 'phantom', feedback: 'Never on the bridge: it can inhibit its vibration and risk the instrument.' },
      { id: 'e', label: 'A foam-wrapped mic wedged between the tailpiece and the body', ok: false, power: 'phantom', feedback: 'An improvised wedge presses on the instrument. Use a mount made for the bass, with the owner’s agreement.' },
    ],
    reasons: [docReason('the strings just above the bridge'), clearReason('the hands, the endpin and the feet, where it cannot tip onto the bass'), POWER_REASON, { id: 'r.room', label: 'The good, isolated room is worth hearing', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON('bass'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point from its named part, clearance and stability, and the power the mic needs.',
  },
  {
    id: `${P}.prac.setup2`,
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage with drums beside the bass. A pickup is installed; one mic channel and one pickup channel; phantom available.',
    setups: [
      { id: 'a', label: 'Pickup on its own channel for the low end; a miniature under the strings below the bridge for detail', ok: true, power: 'phantom', feedback: 'A common, sound plan: the pickup carries the lows, the mic adds detail as feedback allows.' },
      { id: 'b', label: 'Pickup on its own channel; a low-profile mic at the far f-hole, checked for feedback', ok: true, power: 'phantom', feedback: 'A recommended live spot — never on the bridge — with the pickup carrying the lows.' },
      { id: 'c', label: 'Pickup and mic summed onto one channel', ok: false, power: 'phantom', feedback: 'Keep them separate, so a feeding-back mic can come down without losing the bass.' },
      { id: 'd', label: 'The mic alone, 1 m in front, turned up to the band’s level', ok: false, power: 'phantom', feedback: 'On a loud stage a distant mic alone runs out of gain before feedback.' },
      { id: 'e', label: 'A clip on the bridge, so the mic gets the strongest vibration', ok: false, power: 'phantom', feedback: 'Never on the bridge: it can inhibit its vibration.' },
    ],
    reasons: [docReason('the bridge’s foot or the f-hole'), clearReason('the hands, the endpin, the feet and the bridge'), POWER_REASON, { id: 'r.split', label: 'Separate channels let the mic come down without losing the bass', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON('bass'), { id: 'r.polarity', label: 'Flip the pickup’s polarity: that always fixes the blend', role: 'wrong', feedback: 'Polarity is a check after placement and balance; it cannot align every frequency.' }],
    explain: 'Two plans pass. What passes is the reasoning: a mount that respects the bridge, the pickup and the mic on separate channels, clearance, and the power the mic needs.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: once the finger lets go, what does the string do?', options: ['It stops at once', 'It swings back and rings on', 'It holds its pulled shape'], after: 'Now STEP through (or PLAY ONCE) and watch the string, the bridge and the top.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic a little higher, toward the fingerboard. What changes?', options: ['More finger and pitch', 'More body', 'It depends on this bass'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The drum kit sits off to the bassist’s right. Will aiming the mic away remove it?', options: ['Yes, completely', 'Partly — least in the lows', 'No difference at all'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Which part should never have a mic or clip clamped to it?',
    options: ['The bridge', 'The two outer strings below the bridge', 'A stable stand in front of the bass'],
    correct: 'The bridge',
    explain: 'Clipping the bridge can inhibit its vibration. A clip made for the bass grips the strings below it instead.',
    why: {
      'The two outer strings below the bridge': 'That is where a bass clip is made to attach — with the owner’s agreement.',
      'A stable stand in front of the bass': 'A stand in front is fine, placed so it cannot tip onto the bass.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What holds the bass up off the floor?',
    options: ['The endpin, a metal spike at the bottom', 'The bridge, pressing on the top', 'The tailpiece, hooked to the floor'],
    correct: 'The endpin, a metal spike at the bottom',
    explain: 'The endpin rests on the floor; keep stands, cables and feet clear of its point.',
    why: {
      'The bridge, pressing on the top': 'The bridge carries the strings; the endpin holds the bass up.',
      'The tailpiece, hooked to the floor': 'The tailpiece anchors the strings; it never touches the floor.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A four-string bass’s lowest open note is about…',
    options: ['41 Hz', '131 Hz', '196 Hz'],
    correct: '41 Hz',
    explain: 'The open E is about 41 Hz; a mic and channel must keep useful lows — and the detail above.',
    why: {
      '131 Hz': 'That is a viola’s low C.',
      '196 Hz': 'That is a violin’s low G.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Once the finger releases a plucked string…',
    options: ['It rings on and slowly dies away', 'It keeps sounding at the same level', 'It stops as soon as it is let go'],
    correct: 'It rings on and slowly dies away',
    explain: 'Nothing keeps a plucked string going: after the attack it rings and fades — the body of the note.',
    why: {
      'It keeps sounding at the same level': 'That is a bowed string, fed by the bow.',
      'It stops as soon as it is let go': 'It rings on after release; it fades, but not at once.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Where must a stand never be placed around an upright bass?',
    options: ['Where it could tip onto the bass, or by the endpin and feet', 'In front of the bass, at a safe distance', 'Anywhere the audience could see it'],
    correct: 'Where it could tip onto the bass, or by the endpin and feet',
    explain: 'A falling stand can damage a bass; feet and the endpin share the floor. Clearance and stability come first.',
    why: {
      'In front of the bass, at a safe distance': 'That is fine — placed so it cannot fall onto the bass.',
      'Anywhere the audience could see it': 'Looks matter less than safety.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = BASS_PLUCK.floorY;
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

export const C06A_LESSON: Lesson = {
  id: 'C06a',
  labId: 'strings',
  title: 'Upright Bass, Plucked',
  subtitle: 'In front just above the bridge, an f-hole, or a clip on the strings',
  noun: { one: 'bass', many: 'basses' },
  model: BASS_PLUCK_MODEL,
  micTypeIds: ['sdcCard', 'strMini'],
  zones: BASS_PLUCK_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The upright (double) bass is the largest of the bowed string family, played standing or on a stool, its endpin on the floor. Four strings — E, A, D, G — run over a tall bridge to a pegbox with tuning machines. This lesson is the plucked bass (pizzicato); the bowed bass has its own lesson.', src: 'DPA-DB' },
    { title: 'WHERE YOU MEET IT', text: 'Jazz above all, folk, bluegrass, rockabilly and country, small groups and big bands — and the orchestra. This lesson covers one bass: studio, a band on stage, and a pickup alongside the mic.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'It is the foundation: walking lines, the pulse and the low end under everything. The note needs its fundamental, its body and the finger’s attack — and the player may slap. Ask what the part does.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'This lab draws a large bass — about 1.16 m of body and nearly 2 m tall — on its endpin. Its lowest open string, the E, is about 41 Hz; basses with an extension or a fifth string reach lower.', src: 'MET-EBERLE' },
  ],
  sound: {
    stages: [
      { title: 'The finger pulls the string', text: 'The plucking finger pulls the string sideways and stretches it — a few millimetres, many times larger here than it really moves.' },
      { title: 'Released, it swings back', text: 'Let go, the string swings back past its resting place and rings. Nothing keeps it going, so the note slowly dies away — unlike a bowed note.' },
      { title: 'The string rocks the bridge', text: 'The vibrating string pulls the top of the tall bridge from side to side, and the bridge rocks on its two feet.' },
      { title: 'The bridge drives the top', text: 'Under one foot the top moves in and out; under the other, the soundpost holds the top nearly still and passes the motion to the back. The large top, the back and the air inside all vibrate.' },
      { title: 'Sound leaves the body', text: 'Low fundamentals, harmonics, fingerboard sounds and the room come from different places: the whole body radiates, and air breathes through the f-holes. Where the mic sits decides the balance.' },
    ],
    attack: 'The start of the note: the finger’s pluck — the attack, and any slap — strongest at the strings above the bridge. A mic higher toward the fingerboard tends to hear more of it.',
    body: 'The ring after the pluck: the strings, the bridge, the body and the air inside, fading away — low fundamentals and harmonics leaving from the whole instrument and the f-holes. Both are tendencies; basses vary.',
    head: { diameterMm: 0, rods: 0, label: 'the E string', strikeSrc: 'PHYS-ET' },
  },
  setting: {
    items: bassSetting('pluck'),
    stage: 'LIVE: the bass shares the stage with drums, an amp and wedges, and the PA carries most of it. A pickup often carries the low end; a mic adds the acoustic detail as far as feedback allows — on its own channel.',
    studio: 'STUDIO: no wedges, a room to hear — and its low-frequency modes to check. In a good isolated room one mic in front, or an omni, can carry the whole bass.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic plucked-bass setup for a studio and a stage, explain the pickup’s role, and say what would justify a second path. With a real bass and the bassist’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'pickup', label: 'Pickup', kind: 'choice', choices: ['none', 'installed, used', 'installed, not used'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'miniature on a clip', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from which part', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The bass’s height above the floor (endpin 250 mm, a 15° lean back; the proposal’s 20° turn left out) — drawing defaults — so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The bass is drawn at one large museum instrument’s size (body 1162 mm, string length 1115); modern basses are often smaller. Stop (665), bridge height (160), arching and the fingerboard are drawing defaults.', dims: [] },
    { text: 'The plucking hand’s envelope (60–300 mm above the bridge, ±60), the left hand, the player’s body and where the bassist stands (drawn from the instrument: the bass’s back against the player) — illustrative.', dims: [] },
    { text: '“Just above the bridge” read as 6–15 cm up the strings, 15–30 cm out in front; the f-hole’s “a few inches” as 5–10 cm; the clip distances — drawing defaults.', dims: [] },
    { text: 'The miniature’s capsule and gooseneck reach, and the small condenser’s diameter — drawing defaults.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every bass, bassist and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one bassist in a typical stance, the hands’ space, mic patterns and the two-mic comb as textbook shapes, and string and body motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the bassist stopped, only with their agreement — and never where a stand could fall onto the bass.',
  copy: bassCopy('pluck', { worked: 'ub.front', context: 'ub.front', twoA: 'ub.under', twoB: 'ub.front', prefix: P, studioId: `${P}.ctx.studio` }),
};
