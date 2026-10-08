/**
 * B11 ATHLETES, COACHES AND OFFICIALS — the lesson's pages as DATA
 * (blueprint §7). The words come from the owner's lesson (docs/labs/miking/
 * source_text/B11-Athletes-Coaches-and-Officials-Miking-Technique.txt, cited
 * "L<n>" in COMMENTS only) with the fixes logged in docs/labs/miking/
 * CORRECTIONS_LOG.md ("L7B-G1") applied — no rule book, sport body or
 * article number on screen (one plain approval card, D7-1), "a consenting
 * adult" kept in the practice (B11-01), "you" for the learner (R-07), and
 * the safety lines exact and plain: approval before any fit; never alter,
 * drill or displace protective equipment; never send crew into play; the
 * officials' private circuit never opened into the program.
 *
 * One wearer standing at the origin (frame V, frame T on the body) with WHO
 * as the variant (COACH / OFFICIAL / ATHLETE). OWNER RULING 2026-10-04 —
 * suggested starting points, never dogma; no source, brand or model in
 * learner text; no badges.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, clearReason, docReason, hearingCheck, hollowSymptom, polarityDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { LOUD_VOICE, removeDelayVoice } from '../shared/broadcast/sportItems.ts';
import { B11_MODEL, FLOOR, PA_C } from './geometry.ts';
import { B11_ZONES } from './model.ts';
import { B11_COPY } from './copy.ts';

const W: Words = { noun: 'body', player: 'wearer', moving: 'the head, the arms and the torso' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the wearer and the approval',
    goal: 'Get to know a person in sport as a mic’s place — where the voice leaves, where a body mic, its pack and its cable can sit, what is never touched, and the systems that are theirs, not yours — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The voice leaves through the mouth; approval, protective equipment and the person’s own communications decide where a mic may go at all.',
  },
  sound: {
    title: 'Where the voice comes from',
    goal: 'See where speech leaves the wearer, where a body mic and its chain sit on the body, and what a head turn does at a chest mic against a headset.',
    credit: { scenarios: ['b11.snd.1', 'b11.snd.2', 'b11.snd.3'], note: 'Answer the three checks.' },
    takeaway: 'Every distance is read from the lips. A chest mic stays on the chest as the head turns; a headset turns with it. The pack sits low and retained, its antenna straight, the cable with a loop and slack.',
  },
  setting: {
    title: 'Before any mic',
    goal: 'Know that approval is the first mic position — who may be miked, where the pack sits, where the audio may go — and where each mic goes, with the officials’ private circuit kept closed.',
    credit: { scenarios: ['b11.set.1', 'b11.set.2', 'b11.set.3', 'b11.set.4'], note: 'Answer the four checks.' },
    takeaway: 'Approval first; protective equipment never touched; a broadcast mic kept apart from the team’s and the officials’ own systems; every route written down — and the private circuit never on air.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a body-worn mic only after approval — a miniature at the approved place, an approved headset, the event’s announcement mic — and know what each must survive.',
    credit: { scenarios: ['b11.mic.1', 'b11.mic.2', 'b11.mic.3', 'b11.mic.4', 'b11.rec.1'], note: 'Answer the five checks (one reaches back to the wearer and the kit).' },
    takeaway: 'An approved miniature at the approved place; a headset where it is allowed and a steadier distance matters; the event’s own announcement mic for an official. Sweat-resistant is not waterproof.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin once a mount is approved — a miniature at the breastbone, a headset boom at the mouth corner — then move it and see what changes.',
    credit: { scenarios: ['b11.place.1', 'b11.place.2', 'b11.place.3', 'b11.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the wearer’s equipment, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from the lips — and only where approved. The cable’s loop, the pack’s retention and the antenna matter as much as the capsule.',
  },
  context: {
    title: 'Coach, official or athlete',
    goal: 'Aim an official’s announcement headset so its rejection faces the PA — and know why a coach, an official and an athlete each need different choices.',
    credit: { scenarios: ['b11.ctx.1', 'b11.ctx.2', 'b11.ctx.studio', 'b11.rec.3'], interactive: 'wedgeInNull', note: 'OFFICIAL: aim the headset (or change its pattern) until the PA sits in the rejection. COACH: answer the decision card. Then the three checks.' },
    takeaway: 'A coach: an approved chest mic or headset, apart from the team’s own; an official: the announcement mic opened on purpose and muted again; an athlete: only the approved place, and often no mount at all.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a chest mic and a headset open on the same voice sound hollow, how the arrival-time difference places comb notches, and why one of them is chosen for the program.',
    credit: { scenarios: ['b11.two.1', 'b11.two.2', 'b11.two.3', 'b11.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'One voice into two open mics arrives twice: the sum cancels some pitches. Choose one mic for the program, or switch on purpose; polarity flips the sign and never removes a delay.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Some problems are audio problems; a loose pack, a displaced pad, heat or a dangling cable is a STOP — mute it and use the fallback. Never send crew into play.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a body-worn mic in the right order, choose and justify a setup for a coach and for an official, and say what the fallback is when a mount is refused.',
    credit: { scenarios: ['b11.prac.order', 'b11.prac.gain', 'b11.prac.setup1', 'b11.prac.setup2', 'b11.prac.3', 'b11.mix.1', 'b11.mix.2', 'b11.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The permission sheet is optional — it needs a real event and a real person.' },
    takeaway: 'Approval, a fit that survives safe movement, one mic per voice on its own channel to its approved destination, stop conditions named and a fallback ready. A brand, a hidden mount or an assumed permission never pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only: b11.snd.* L15, L24, L25, L29 ·
 * b11.set.* L5, L6, L19, L32 · b11.mic.* L12–L19, L26 · b11.place.* L24,
 * L25 · b11.ctx.* L17–L19 · b11.two.* L29 · b11.prac.* / b11.mix.* L29–L41.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'b11.snd.1',
    page: 'sound',
    prompt: 'A coach with a chest mic turns to shout to the bench. What happens at the mic?',
    options: ['The mouth turns away: the voice changes', 'The mic turns with the head, so nothing', 'The voice gets louder at the chest mic'],
    correct: 'The mouth turns away: the voice changes',
    explain: 'The chest stays while the head turns: the mouth moves away and off the capsule’s line, and the tone and level change. A headset boom turns with the head.',
    why: {
      'The mic turns with the head, so nothing': 'A chest mic moves with the torso, not the head.',
      'The voice gets louder at the chest mic': 'Turned away, the mouth is farther and off its line.',
    },
  },
  {
    id: 'b11.snd.2',
    page: 'sound',
    prompt: 'Where does the transmitter pack go, and how does its antenna hang?',
    options: ['The approved low place, antenna straight', 'In a pocket, the antenna coiled up neatly', 'Taped under a shoulder pad, out of the way'],
    correct: 'The approved low place, antenna straight',
    explain: 'The pack sits in its approved low-profile place, retained so it cannot move, no hard edge pressing in; the antenna as the maker says — never coiled or folded.',
    why: {
      'In a pocket, the antenna coiled up neatly': 'A loose pack moves, and a coiled antenna loses range.',
      'Taped under a shoulder pad, out of the way': 'Never put anything under or on protective equipment.',
    },
  },
  {
    id: 'b11.snd.3',
    page: 'sound',
    prompt: 'A coach’s chest mic and broadcast headset are both open. Why can the voice sound hollow?',
    options: ['It reaches both mics, at two times', 'The headset reverses the chest mic', 'Two mics make the voice twice as loud'],
    correct: 'It reaches both mics, at two times',
    explain: 'The voice reaches the headset first and the chest mic a little later. Summed, some pitches cancel — choose one, or switch on purpose.',
    why: {
      'The headset reverses the chest mic': 'Distance delays a sound; it does not flip its sign.',
      'Two mics make the voice twice as loud': 'The second copy is later: it colours the voice more than it adds level.',
    },
  },
  hearingCheck('b11.set.1', W),
  {
    id: 'b11.set.2',
    page: 'setting',
    prompt: 'You hold a sideline credential. What does it let you do about a player’s mic?',
    options: ['Nothing alone: a mount needs its own approval', 'Fit one, since the credential covers work on the field', 'Enough, if the player agrees to wear one'],
    correct: 'Nothing alone: a mount needs its own approval',
    explain: 'A credential is not permission to mount a mic. The rules, the production, the team, the person and a named equipment reviewer all come first.',
    why: {
      'Fit one, since the credential covers work on the field': 'A credential gives access, not permission to fit a mic on a person.',
      'Enough, if the player agrees to wear one': 'The person’s agreement is one part; the rules and the team must approve too.',
    },
  },
  {
    id: 'b11.set.3',
    page: 'setting',
    prompt: 'The officials talk on their own private circuit. Where does it go?',
    options: ['Only its own route — never assumed for air', 'Into the program, since it makes the coverage more exciting', 'Low under the commentary, so it is barely heard'],
    correct: 'Only its own route — never assumed for air',
    explain: 'The inter-official, medical or tactical channel stays on its approved route. Only what is explicitly authorized goes to air.',
    why: {
      'Into the program, since it makes the coverage more exciting': 'Excitement is not permission: the private circuit stays private.',
      'Low under the commentary, so it is barely heard': 'Quiet or not, it is not the program’s to carry.',
    },
  },
  {
    id: 'b11.set.4',
    page: 'setting',
    prompt: 'The only spot for the pack is inside a shoulder pad. What do you do?',
    options: ['Leave the pad alone; find another or no mount', 'Cut a small slot in the pad so the pack sits inside', 'Tape the pack firmly to the pad’s outside'],
    correct: 'Leave the pad alone; find another or no mount',
    explain: 'Never drill, cut, alter or displace protective equipment to make room. Another approved place — or no mount and the fallback.',
    why: {
      'Cut a small slot in the pad so the pack sits inside': 'Altering protective equipment is never acceptable.',
      'Tape the pack firmly to the pad’s outside': 'Nothing goes on protective equipment without its own approval — and it can harm in contact.',
    },
  },
  {
    id: 'b11.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · The coach turns to the bench. Which mic keeps the same distance to the mouth?',
    options: ['A headset boom: it turns with the head', 'A chest mic, clipped at the breastbone', 'A boom held outside play'],
    correct: 'A headset boom: it turns with the head',
    explain: 'A headset rides on the head, so its capsule stays at the mouth corner through every turn.',
    why: {
      'A chest mic, clipped at the breastbone': 'The chest stays while the head turns.',
      'A boom held outside play': 'An operator must re-aim it, and it is far away.',
    },
  },
  {
    id: 'b11.mic.1',
    page: 'microphone',
    prompt: 'Where an athlete’s mount is approved, which mic fits?',
    options: ['A miniature at the exact approved place', 'A handheld that the athlete carries during play', 'Whichever mic fits under the helmet'],
    correct: 'A miniature at the exact approved place',
    explain: 'An approved miniature or purpose-made low-profile pickup, at the exact approved place only — and many sports refuse a mount entirely.',
    why: {
      'A handheld that the athlete carries during play': 'Nobody carries a mic in play.',
      'Whichever mic fits under the helmet': 'Nothing goes in or on a helmet without its own approval.',
    },
  },
  {
    id: 'b11.mic.2',
    page: 'microphone',
    prompt: 'Why might an approved headset suit a coach better than a chest mic?',
    options: ['A steadier distance as the head turns', 'It joins the team’s own headset channel', 'It hears the players on the field better'],
    correct: 'A steadier distance as the head turns',
    explain: 'The boom stays at the mouth corner through the turns. It must stay separate from the team’s own communications.',
    why: {
      'It joins the team’s own headset channel': 'A broadcast mic never taps into the team’s communications.',
      'It hears the players on the field better': 'It is for the coach’s voice, at their mouth.',
    },
  },
  {
    id: 'b11.mic.3',
    page: 'microphone',
    prompt: 'How is an official’s announcement mic used?',
    options: ['Opened on purpose, then muted again', 'Left open so nothing is missed', 'Opened by the program when it wants'],
    correct: 'Opened on purpose, then muted again',
    explain: 'The event’s approved announcement mic goes to the PA, opened for the announcement and muted after it. A split to the broadcast needs explicit permission.',
    why: {
      'Left open so nothing is missed': 'Left open, it would carry private talk and feed the PA back.',
      'Opened by the program when it wants': 'The official and the event control it, on their approved route.',
    },
  },
  {
    id: 'b11.mic.4',
    page: 'microphone',
    prompt: 'The body mic is “sweat-resistant”. What does that mean in the rain?',
    options: ['Not waterproof: protect it, check it', 'Waterproof: it can go out in the pouring rain', 'It can be rinsed under a tap after'],
    correct: 'Not waterproof: protect it, check it',
    explain: 'Sweat resistance varies by product and is not waterproofing. Use the maker’s moisture protection and listen for intermittent audio as it gets wet.',
    why: {
      'Waterproof: it can go out in the pouring rain': 'Sweat-resistant is not waterproof.',
      'It can be rinsed under a tap after': 'Clean and dry each part only as its maker says.',
    },
  },
  {
    id: 'b11.place.1',
    page: 'placement',
    prompt: 'A chest-mic start says “about 21 cm from the lips”. What is it measured from?',
    options: ['The lips, to the capsule’s front', 'The collar, to the clip that holds the mic', 'The belt, to the pack at the small of the back'],
    correct: 'The lips, to the capsule’s front',
    explain: 'The voice leaves at the mouth, so the distance starts at the lips and ends at the mic’s front. The 21 cm is the drawing’s place; no chest position fits every body.',
    why: {
      'The collar, to the clip that holds the mic': 'The collar is a landmark, not where the voice leaves.',
      'The belt, to the pack at the small of the back': 'The pack’s place is about retention, not the voice’s distance.',
    },
  },
  {
    id: 'b11.place.2',
    page: 'placement',
    prompt: 'How should the cable leave a body mic?',
    options: ['A small loop and slack, nothing exposed', 'Pulled tight so that nothing on it can move', 'In a big loop outside the shirt, easy to reach'],
    correct: 'A small loop and slack, nothing exposed',
    explain: 'Gentle strain relief at the mic and enough slack for the head and the torso — without an exposed loop that can catch a hand, an opponent or equipment.',
    why: {
      'Pulled tight so that nothing on it can move': 'Tight, every movement tugs the mic: noise, and a cable that can break.',
      'In a big loop outside the shirt, easy to reach': 'An exposed loop can catch a hand or equipment.',
    },
  },
  {
    id: 'b11.place.3',
    page: 'placement',
    prompt: 'The chest mic rubs on every arm raise. A first idea to try?',
    options: ['Move it clear of fabric edges and zips', 'Cut the low end hard on the channel', 'Ask the coach not to raise their arms so high'],
    correct: 'Move it clear of fabric edges and zips',
    explain: 'Keep fabric edges, zips, badges, jewellery, pads and straps from rubbing or striking it — within the approved place.',
    why: {
      'Cut the low end hard on the channel': 'A filter thins the voice and leaves the rub.',
      'Ask the coach not to raise their arms so high': 'Moving is the job; fit the mic to it.',
    },
  },
  {
    id: 'b11.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must never be altered to make room for a mic?',
    options: ['Helmets, pads and protective gear', 'The outside of the coach’s jacket', 'The cable’s route to the pack'],
    correct: 'Helmets, pads and protective gear',
    explain: 'Never drill, alter, compromise or displace protective equipment. The cable’s route and the clothing are fitted within the approval.',
    why: {
      'The outside of the coach’s jacket': 'Clothing can be fitted with approval; protective gear never.',
      'The cable’s route to the pack': 'The route is planned and secured — that is fitting, not altering protection.',
    },
  },
  {
    id: 'b11.ctx.1',
    page: 'context',
    prompt: 'An official’s announcement mic feeds the PA. A fair first step?',
    options: ['Close capsule, opened only to announce', 'Left open through play in case of anything', 'Turned up to be heard over the crowd'],
    correct: 'Close capsule, opened only to announce',
    explain: 'Close and opened on purpose: the fewest open mics, the PA as far into the rejection as the mouth allows. Never provoke feedback.',
    why: {
      'Left open through play in case of anything': 'An open mic feeds the PA back and carries private talk.',
      'Turned up to be heard over the crowd': 'More gain brings feedback closer; the PA’s level is set by the PA.',
    },
  },
  superNull('b11.ctx.2', 'context', 'PA'),
  {
    id: 'b11.ctx.studio',
    page: 'context',
    prompt: 'A coach has agreed to a mic and the event has approved it. A fair first setup?',
    options: ['A chest mic or a headset at the approved place', 'A mic clipped to the team’s own headset cable', 'A mic hidden in the bench without telling them'],
    correct: 'A chest mic or a headset at the approved place',
    explain: 'With approval: a body mic at the approved place, or an approved headset — on its own channel, apart from the team’s communications.',
    why: {
      'A mic clipped to the team’s own headset cable': 'The team’s communications are their own system.',
      'A mic hidden in the bench without telling them': 'Never hide a mic to record someone without approval.',
    },
  },
  {
    id: 'b11.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · What is the first “position” of an athlete’s mic?',
    options: ['The approval, before any place', 'The breastbone, before anything else', 'The helmet, close to the mouth'],
    correct: 'The approval, before any place',
    explain: 'Approval is the first mic position: the rules, the team, the person and the equipment reviewer — then the exact approved place.',
    why: {
      'The breastbone, before anything else': 'A place comes after approval, and only if approved.',
      'The helmet, close to the mouth': 'Nothing goes in or on a helmet without its own approval.',
    },
  },
  {
    id: 'b11.two.1',
    page: 'twoMic',
    prompt: 'The coach’s chest mic and headset are both open. Why does the voice sound hollow?',
    options: ['It reaches the chest mic later', 'The chest mic reverses its polarity', 'The headset is louder, so it cancels'],
    correct: 'It reaches the chest mic later',
    explain: 'The voice reaches the headset first and the chest mic later. Summed, some pitches cancel — a comb.',
    why: {
      'The chest mic reverses its polarity': 'Distance delays a sound; it does not flip its sign.',
      'The headset is louder, so it cancels': 'A level difference changes how deep the notches are; the delay makes them.',
    },
  },
  polarityDelay('b11.two.2'),
  {
    id: 'b11.two.3',
    page: 'twoMic',
    prompt: 'A coach wears both a chest mic and a headset. What goes to the program?',
    options: ['One of them, chosen on purpose', 'Both open, for a fuller voice', 'Whichever is louder at the time'],
    correct: 'One of them, chosen on purpose',
    explain: 'Choose one for the program, or make a deliberate transition. Two open mics on one voice comb.',
    why: {
      'Both open, for a fuller voice': 'Both open sound hollower, not fuller.',
      'Whichever is louder at the time': 'Switching by level swaps tones at random; choose on purpose.',
    },
  },
  {
    id: 'b11.two.4',
    page: 'twoMic',
    prompt: 'Why does each miked person get their own labelled channel?',
    options: ['Each is checked, muted and routed alone', 'Two channels make both of the voices louder', 'So the mics form a stereo pair'],
    correct: 'Each is checked, muted and routed alone',
    explain: 'One person, one channel: soloed, muted when it must be, sent only to its approved destination.',
    why: {
      'Two channels make both of the voices louder': 'Level comes from gain, not from channels.',
      'So the mics form a stereo pair': 'They are body mics on different people, not a stereo pair.',
    },
  },
  {
    id: 'b11.prac.gain',
    page: 'practice',
    prompt: 'The celebration lights the transmitter’s overload light; normal speech sits well below. What do you do?',
    options: ['Lower the transmitter’s input gain; recheck', 'Pull the channel fader down at the desk until clean', 'Ask the coach not to celebrate so loudly'],
    correct: 'Lower the transmitter’s input gain; recheck',
    explain: 'Set the transmitter’s gain for the loudest voice, a whistle nearby or a celebration, with headroom — and watch the transmitter, the receiver and the destination. A fader does not undo clipping at the pack.',
    why: {
      'Pull the channel fader down at the desk until clean': 'The overload is in the pack, before the desk.',
      'Ask the coach not to celebrate so loudly': 'The celebration is the event; set gain for it.',
    },
  },
  {
    id: 'b11.prac.3',
    page: 'practice',
    prompt: 'The equipment reviewer withdraws approval for an athlete’s mount. What now?',
    options: ['The approved perimeter or interview fallback', 'Fit it anyway, but somewhere a little less visible', 'Move the mic onto the athlete’s helmet'],
    correct: 'The approved perimeter or interview fallback',
    explain: 'No mount: use the approved perimeter mic, a boom outside play or a post-event interview — labelled as a different perspective.',
    why: {
      'Fit it anyway, but somewhere a little less visible': 'No approval, no mount — hidden or not.',
      'Move the mic onto the athlete’s helmet': 'Never on protective equipment.',
    },
  },
  {
    id: 'b11.mix.1',
    page: 'practice',
    prompt: 'During play the athlete’s pack works loose and a cable dangles. What do you do?',
    options: ['Mute it and use the fallback; no one into play', 'Send a crew member on during play to fix it quickly', 'Leave it: the audio is still working'],
    correct: 'Mute it and use the fallback; no one into play',
    explain: 'A loose pack or a dangling cable is a stop condition: mute or withdraw it and use the approved fallback. Never send crew into play to repair a mic.',
    why: {
      'Send a crew member on during play to fix it quickly': 'Never into play: the event’s people decide any access.',
      'Leave it: the audio is still working': 'It is a safety stop, not an audio question.',
    },
  },
  {
    id: 'b11.mix.2',
    page: 'practice',
    prompt: 'Who plans the frequencies for the body mics, the intercom and the officials’ systems?',
    options: ['The venue’s radio coordinator, for all', 'Each crew separately, for its own system only', 'The first to switch on gets the clearest one'],
    correct: 'The venue’s radio coordinator, for all',
    explain: 'One coordinator assigns and monitors frequencies and the antenna plan for the whole venue — broadcast, intercom, IFB and the officials’ systems.',
    why: {
      'Each crew separately, for its own system only': 'Separate plans collide; the venue coordinates them all.',
      'The first to switch on gets the clearest one': 'First come is how systems knock each other out.',
    },
  },
  removeDelayVoice('b11.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'b11.sym.rub',
    observation: 'Rubbing and clicks on every movement',
    firstChecks: 'Is the capsule against a fabric edge, a zip, a badge or a strap? Is the cable tugging?',
    options: ['Clear the capsule; strain relief and slack', 'A deep low cut on the channel and carry on', 'Ask the wearer to move less during play'],
    correct: 'Clear the capsule; strain relief and slack',
    explain: 'Contact noise starts at the capsule and the cable: clear the capsule of rubbing edges, add strain relief and slack — within the approved place.',
    why: {
      'A deep low cut on the channel and carry on': 'A filter thins the voice and leaves the rub.',
      'Ask the wearer to move less during play': 'Movement is the event; fit the mic to it.',
    },
  },
  {
    id: 'b11.sym.drop',
    observation: 'Dropouts when the wearer turns away',
    firstChecks: 'Is the body shadowing the antenna? Is the antenna straight? Batteries? Is the receiver placed for the movement area?',
    options: ['Check the antenna, the batteries, the plan', 'Coil the antenna up so it cannot snag on anything', 'Turn the receiver’s output up a lot'],
    correct: 'Check the antenna, the batteries, the plan',
    explain: 'The body can shadow the radio path: the antenna as the maker says, fresh batteries, the venue’s antenna plan walked at real density.',
    why: {
      'Coil the antenna up so it cannot snag on anything': 'A coiled antenna loses range.',
      'Turn the receiver’s output up a lot': 'Level does not restore a lost radio signal.',
    },
  },
  {
    id: 'b11.sym.breath',
    observation: 'Breath blasts on a headset during exertion',
    firstChecks: 'Is the capsule in front of the mouth, in the breath? Is the windscreen on?',
    options: ['Capsule to the mouth corner; windscreen on', 'A deep low cut on the headset’s channel', 'Ask the coach to breathe in and out through the nose'],
    correct: 'Capsule to the mouth corner; windscreen on',
    explain: 'At the outside corner of the mouth, just out of the breath, with the maker’s windscreen. A filter cannot repair an overload from a blast.',
    why: {
      'A deep low cut on the headset’s channel': 'A filter after the overload cannot undo it.',
      'Ask the coach to breathe in and out through the nose': 'Breathing hard is the event; fit the mic to it.',
    },
  },
  {
    id: 'b11.sym.pack',
    observation: 'The pack shifts and presses during a sprint',
    firstChecks: 'Is it in its approved place and retained? Any hard edge on the body? Is it a stop condition?',
    options: ['Stop: refit, or abandon the mount', 'Tape it tighter and carry on', 'Leave it — the audio still sounds fine'],
    correct: 'Stop: refit, or abandon the mount',
    explain: 'When retention or comfort fails it is a stop: refit it in the approved place, or abandon the mount and use the fallback.',
    why: {
      'Tape it tighter and carry on': 'More tape is not retention; refit properly or stop.',
      'Leave it — the audio still sounds fine': 'It is a safety question, not an audio one.',
    },
  },
  {
    id: 'b11.sym.wet',
    observation: 'Crackles come and go as the wearer sweats',
    firstChecks: 'Is the connector protected? Is the capsule covered by wet fabric? Is the product rated for it?',
    options: ['The maker’s moisture protection; check it', 'Wrap the pack tightly in a sealed plastic bag', 'Turn the gain up until it covers the crackles'],
    correct: 'The maker’s moisture protection; check it',
    explain: 'Use the maker’s windscreen, connector and moisture protection, and listen as perspiration builds. Do not seal transmitter electronics in an unplanned wet enclosure.',
    why: {
      'Wrap the pack tightly in a sealed plastic bag': 'Sealing a pack traps moisture and heat; follow the maker.',
      'Turn the gain up until it covers the crackles': 'Gain raises the crackles too.',
    },
  },
  hollowSymptom('b11.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'b11.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a body-worn mic setup in the order you would do them.',
    steps: [
      { text: 'Get the rules, the team’s and the person’s approval, the reviewer', early: 'Approval comes before anything else.' },
      { text: 'Agree the place, the pack’s place, the destination, who removes it', early: 'Agree the details once there is approval.' },
      { text: 'Fit the mic with an authorized person, clear of protective gear', early: 'Fit only what is agreed.' },
      { text: 'Strain relief, slack, the pack retained, the antenna straight', early: 'Secure the chain once the mic is fitted.' },
      { text: 'Set the transmitter’s gain for the loudest moment', early: 'Gain comes once the chain is secure.' },
      { text: 'Test safe movement; listen at the real destination', early: 'Test once the gain is set.' },
      { text: 'Name the monitor, the stop conditions and the fallback', early: 'The stop conditions and the fallback close the setup.' },
    ],
    explain: 'A sensible order. Rehearse with a consenting adult in non-contact clothing; never stage contact for a test.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'b11.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A coach at the sideline; the event and the coach approve a broadcast mic; the coach wears the team’s own headset.',
    setups: [
      { id: 'a', label: 'A miniature at the approved place on the chest, its own channel', ok: true, power: 'none', feedback: 'A recommended start: both hands left for the work — check rub, turns and the pack’s retention.' },
      { id: 'b', label: 'An approved broadcast headset, apart from the team headset', ok: true, power: 'none', feedback: 'A recommended start: a steadier distance — check the fit beside the team’s headset.' },
      { id: 'c', label: 'A mic spliced into the team headset’s line', ok: false, power: 'none', feedback: 'The team’s communications are their own system: never tap into them.' },
      { id: 'd', label: 'A chest mic and a headset both open in the program', ok: false, power: 'none', feedback: 'Two open mics on one voice comb. Choose one.' },
      { id: 'e', label: 'A mic hidden on the bench, not mentioned to the team', ok: false, power: 'none', feedback: 'Never record someone with a hidden mic without approval.' },
    ],
    reasons: [docReason('the lips'), clearReason('the team’s equipment and the field'), { id: 'r.approval', label: 'The event and the coach approved the mic, its place and its destination', role: 'required', feedback: 'Say what was approved and by whom.' }, { id: 'r.channel', label: 'Its own labelled channel, to the approved destination only', role: 'required', feedback: 'Say where the audio may go.' }, BRAND_REASON('coach'), LOUD_VOICE],
    explain: 'More than one setup passes. What passes is the reasoning: approval, a start measured from the lips, clear of the team’s equipment, its own channel to the approved destination.',
  },
  {
    id: 'b11.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · An official makes public announcements over the stadium PA; the broadcast has permission to carry them.',
    setups: [
      { id: 'a', label: 'The event’s announcement headset, opened to announce, muted after', ok: true, power: 'none', feedback: 'A recommended start: opened on purpose — check the PA against its pattern.' },
      { id: 'b', label: 'The approved announcement mic split to the PA and the program', ok: true, power: 'none', feedback: 'A recommended start with permission for the split — check the route and the mute.' },
      { id: 'c', label: 'The officials’ private circuit routed into the program', ok: false, power: 'none', feedback: 'Never open the private circuit into the program by assumption.' },
      { id: 'd', label: 'The announcement mic left open through play', ok: false, power: 'none', feedback: 'Left open it carries private talk and feeds the PA back.' },
      { id: 'e', label: 'A crew member walks on to swap a failing pack', ok: false, power: 'none', feedback: 'Never into play: mute it and use the tested spare outside play.' },
    ],
    reasons: [docReason('the lips'), clearReason('the field and the official’s own equipment'), { id: 'r.route', label: 'The PA, the program and the private circuit are traced as separate routes', role: 'required', feedback: 'Say how each route is checked.' }, { id: 'r.mute', label: 'The mic is opened on purpose and muted again', role: 'optional', feedback: 'A fair announcement reason.' }, BRAND_REASON('official'), { id: 'r.private', label: 'The private circuit adds drama to the program', role: 'wrong', feedback: 'The private circuit is never the program’s by assumption.' }],
    explain: 'Two setups pass. What passes is the reasoning: the approved announcement mic, opened on purpose, every route traced — and the private circuit kept closed.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: where does the coach’s voice leave the body?', options: ['The chest', 'The mouth (and the nose)', 'The throat'], after: 'Now STEP through (or PLAY ONCE), then look at the body mic from the front and the side, and turn the head.' },
  microphone: { prompt: 'Before you move anything: which mic keeps one distance as the head turns?', options: ['A chest mic', 'A headset boom', 'Both of them'], after: 'Now choose each TYPE and see where it starts.' },
  placement: { prompt: 'Predict: you move the chest mic from the breastbone down to the belt. What changes?', options: ['More distance, more crowd', 'A closer voice', 'It depends on this person'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The PA is high in front of the official. Where will a supercardioid headset reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the capsule with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip the headset’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'sound',
    prompt: 'A coach with a chest mic turns to the bench. What changes at the mic?',
    options: ['The mouth turns away: the voice changes', 'Nothing: the mic is on the coach’s body', 'The mic turns with the head to follow it'],
    correct: 'The mouth turns away: the voice changes',
    explain: 'The chest stays while the head turns: the voice’s distance and angle to the mic change.',
    why: {
      'Nothing: the mic is on the coach’s body': 'On the body, but not on the head: the mouth moves.',
      'The mic turns with the head to follow it': 'Only a headset boom turns with the head.',
    },
  },
  {
    id: 'q.2',
    covers: 'sound',
    prompt: 'How does a body mic’s antenna hang?',
    options: ['Straight, as its maker says', 'Coiled up so it cannot catch', 'Folded under the pack'],
    correct: 'Straight, as its maker says',
    explain: 'Keep the antenna as the maker specifies — straight, never tightly coiled or folded.',
    why: {
      'Coiled up so it cannot catch': 'Coiling an antenna costs it range.',
      'Folded under the pack': 'Folding costs range too.',
    },
  },
  {
    id: 'q.3',
    covers: 'setting',
    critical: true,
    prompt: 'The only room for the pack is inside a shoulder pad. What do you do?',
    options: ['Leave the pad; another place or no mount', 'Cut a slot in the pad so the pack fits inside', 'Tape the pack to the pad’s outside'],
    correct: 'Leave the pad; another place or no mount',
    explain: 'Never drill, cut, alter or displace protective equipment. Another approved place, or no mount and the fallback.',
    why: {
      'Cut a slot in the pad so the pack fits inside': 'Altering protective equipment is never acceptable.',
      'Tape the pack to the pad’s outside': 'Nothing goes on protective equipment without its own approval.',
    },
  },
  {
    id: 'q.4',
    covers: 'setting',
    prompt: 'What comes before fitting any mic on a player?',
    options: ['Approval: rules, team and the person', 'A sideline credential, then a quick fit', 'The producer’s request for more sound'],
    correct: 'Approval: rules, team and the person',
    explain: 'Approval is the first position: rules, production, team, person and a named equipment reviewer.',
    why: {
      'A sideline credential, then a quick fit': 'A credential is not permission to mount a mic.',
      'The producer’s request for more sound': 'Wanting the sound is not permission.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Where does the officials’ private circuit go?',
    options: ['Only its own route, never the program', 'Into the program, kept low under the voices', 'Into the PA, so the crowd can follow'],
    correct: 'Only its own route, never the program',
    explain: 'The inter-official channel stays on its approved route. Public announcements go through the announcement mic, on purpose.',
    why: {
      'Into the program, kept low under the voices': 'Low or not, it is not the program’s.',
      'Into the PA, so the crowd can follow': 'The crowd hears only the announcement mic, opened on purpose.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'During play an athlete’s pack works loose. What do you do?',
    options: ['Mute it; use the fallback; no one into play', 'Send a crew member on to fix it straight away', 'Leave it while the audio still works'],
    correct: 'Mute it; use the fallback; no one into play',
    explain: 'A loose pack is a stop condition: mute or withdraw it and use the fallback. Never send crew into play.',
    why: {
      'Send a crew member on to fix it straight away': 'Never into play to repair a mic.',
      'Leave it while the audio still works': 'It is a safety stop, not an audio question.',
    },
  },
];

const wedges: Wedge[] = [
  {
    id: 'pa',
    label: 'the PA high to the front-left',
    short: 'PA',
    p: { x: PA_C.x, y: FLOOR, z: PA_C.z },
    lift: FLOOR - PA_C.y,
    faces: { x: 1, y: 0, z: 0 },
    note: 'High to the front-left, facing the stands: the official’s announcement goes out through it, and the open mic hears it back.',
    prov: { kind: 'illustrative', reason: 'a typical stadium: the PA’s place and height are drawing defaults' },
    glyph: 'none',
  },
];

export const B11_LESSON: Lesson = {
  id: 'B11',
  labId: 'broadcast',
  title: 'Athletes, Coaches and Officials',
  subtitle: 'Approval is the first mic position: a chest mic or a headset where allowed, the private circuit kept closed, a fallback ready',
  noun: { one: 'wearer', many: 'wearers', subject: 'wearer', person: true },
  model: B11_MODEL,
  micTypeIds: ['locLav', 'bcHeadsetBoom', 'bcHeadsetSuper', 'locBoomSg'],
  zones: B11_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A microphone on a person taking part — a coach, an official, an athlete — for broadcast pickup. It is an equipment and access decision before it is an audio one.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'A coach’s chest mic or headset at the sideline, an official’s announcement headset to the PA, an approved low-profile mic on an athlete — and, where none is allowed, a perimeter mic or an interview.', src: 'LESSON' },
    { title: 'WHAT IT DOES', text: 'It brings very close speech from someone moving — only where approved, only to the approved destination — kept apart from their own communications.', src: 'LESSON' },
    { title: 'NO SINGLE RIGHT PLACE', text: 'Rules, kit, bodies and mics differ: no one chest position or mouth offset fits every uniform. Begin at the approved place, test with safe movement, and adjust by listening. Experimentation is encouraged — inside the approval.', src: 'LESSON' },
  ],
  sound: {
    stages: [
      { title: 'Breath from the lungs', text: 'The lungs push air up the windpipe — hard and fast during exertion, in shouts and calls.' },
      { title: 'The vocal folds buzz', text: 'In the voice box, low in the throat, two small folds come together and the breath sets them buzzing. That buzz is the raw sound of the voice.' },
      { title: 'The throat and mouth shape it', text: 'The throat, the tongue, the lips and the open mouth shape the buzz into vowels and words; the tongue, the teeth and the lips add the consonants.' },
      { title: 'It leaves the mouth', text: 'Almost all of it leaves through the open mouth — on m, n and ng partly through the nose. That is where every distance here is measured from: the lips — a chest mic sits below them.' },
    ],
    attack: 'P and B push a puff of air out of the lips, and exertion pushes harder. A headset capsule at the outside corner of the mouth stays out of most of it; a chest mic is below the breath.',
    body: 'The vowels carry most of the level and the tone. A chest mic hears a fuller, chestier voice, duller as the head turns; a headset boom hears the mouth, and more breath. Tendencies, to check by ear.',
    head: { diameterMm: 0, rods: 0, label: 'the mouth', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'wearer', label: 'the wearer', short: 'WEARER', note: 'Standing, the mouth at the point every distance is read from; the body moves, bends and runs.', prov: { kind: 'illustrative', reason: 'the shared figure standing (drawing default)' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'approval', label: 'the approval', short: 'APPROVAL', note: 'Who may be miked, when, where the pack sits, where the audio may go, who may remove it — before any mic.', prov: { kind: 'illustrative', reason: 'the lesson L5' }, tag: 'FIRST', scene: 'all' },
      { id: 'gear', label: 'protective equipment', short: 'PROTECTIVE GEAR', note: 'Never drilled, altered, compromised or displaced to make room for a mic.', prov: { kind: 'illustrative', reason: 'the lesson L5' }, tag: 'SAFETY', scene: 'all' },
      { id: 'comms', label: 'their own communications', short: 'THEIR COMMS', note: 'The team’s headsets and the officials’ private circuit are separate systems, never tapped or opened into the program.', prov: { kind: 'illustrative', reason: 'the lesson L15, L19' }, tag: 'PRIVATE', scene: 'all' },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'An official’s announcement feeds it — and the open mic hears it back. Opened on purpose, muted again.', prov: { kind: 'illustrative', reason: 'the lesson L17' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'field', label: 'the field of play', short: 'FIELD', note: 'No crew goes into play to repair a mic: mute it and use the fallback.', prov: { kind: 'illustrative', reason: 'the lesson L33' }, tag: 'SAFETY', scene: 'all' },
    ],
    stage: 'OFFICIAL: the event’s announcement headset, opened on purpose to the PA and muted again; the private circuit closed; a tested spare outside play.',
    studio: 'COACH: an approved chest mic or headset, apart from the team’s own; its own channel to the approved destination; a perimeter fallback.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for a coach and for an official, describe the fallback when a mount is refused, and fill a permission sheet. With a consenting adult in non-contact rehearsal clothing — no minors, no contact — you can record what you tried below.',
    fields: [
      { id: 'athleteRow', label: 'PERMISSION · athlete: allowed? where? protective gear? the no-mount alternative', kind: 'text' },
      { id: 'coachRow', label: 'PERMISSION · coach: allowed? where? kept apart from the team’s comms?', kind: 'text' },
      { id: 'officialRow', label: 'PERMISSION · official: the announcement route, the split, the private circuit', kind: 'text' },
      { id: 'fit', label: 'Capsule, cable loop, pack and antenna positions', kind: 'text' },
      { id: 'test', label: 'Movement, radio and headroom results; the named monitor', kind: 'text' },
      { id: 'stop', label: 'Stop conditions, cleaning plan and the fallback', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The standing wearer: the lips 1550 mm above the ground; frame T’s landmarks — the breastbone (~21 cm below the lips), the collar, the small of the back, the ear — drawing defaults on a generic figure; no anthropometry was read.', dims: ['yFloor'] },
    { text: 'The keep-out regions (a helmet, the shoulder pads, the shin pads) are illustrative regions on a generic figure, never rule geometry.', dims: [] },
    { text: 'The headset capsule (2–6 cm beside the mouth corner) is the lab’s drawing; the field’s edge, the PA, the perimeter operator and the boom’s 0.6–1.5 m trial band are drawing defaults.', dims: [] },
    { text: 'The chest mic against the headset as the head turns is by distance alone, the head turning about its centre (a simplified picture).', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — once it is approved — ideas and concepts to consider, not rules. Every person, kit, rule and mic is different: move the mic, experiment within the approval, and trust your ears. The lab is silent and draws a simplified picture: a generic figure, illustrative keep-out regions, textbook patterns. Distances are rounded to about 5 mm and measured from the lips to the mic’s front. Approval first; protective equipment never touched; never into play.',
  copy: B11_COPY,
};
