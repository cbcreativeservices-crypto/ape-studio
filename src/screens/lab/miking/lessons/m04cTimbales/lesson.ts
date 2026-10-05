/**
 * M04c TIMBALES — the lesson's pages as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Timbales-Miking-Technique-Research.txt,
 * "L<n>" in COMMENTS only) with the fixes logged in CORRECTIONS_LOG.md (TB-…).
 * The lesson gives no numeric positions; the starting points are the
 * research folder's regions (drawing defaults for "just above" / "beneath"),
 * in the starting-points voice (owner ruling 2026-10-04).
 * The practice page is the shared PPractice: its ids (k.prac.*, k.mix.*) are
 * that page's contract.
 */
import type { DiagnosticItem, MikingScenario, OrderTask, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { handCopy, type HandLesson } from '../shared/handdrums/family.ts';
import { TIMB_MODEL, TIMB_WORDS } from './geometry.ts';
import { HEAD_Y, LARGE, SMALL, TIMB_DIMS as D, TIMB_ZONES } from './model.ts';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the timbales',
    goal: 'Get to know a pair of timbales — what they are, where you meet them, what they do in the music, and their parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Two shallow, single-headed brass drums on a stand, played with sticks on the heads, the rims and the shells — often with a bell on a bracket. Ask which surfaces the part uses.',
  },
  sound: {
    title: 'How they make their sound',
    goal: 'See how a stick stroke becomes sound, where it leaves the drum, and how the head, the rim and the shell differ. Shown, never played.',
    credit: { scenarios: ['tb.snd.1', 'tb.snd.2', 'tb.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The head gives the drum tone; a rimshot adds the rim; the cáscara is the brass shell ringing — a metal sound. A mic hears more of whichever surface it is near and faces: a tendency to check.',
  },
  setting: {
    title: 'Where they sit',
    goal: 'Know where the timbales sit in a band, the player’s stick space, the accessories, and what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['tb.set.1', 'tb.set.2', 'tb.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The sticks reach above both heads, round the shells and to the accessories: no stand, boom or cable goes there. Bells and cymbals are loud neighbours in every timbale mic. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the pair by its properties — pattern, power, size, mount and the level it can take — not by its brand.',
    credit: { scenarios: ['tb.mic.1', 'tb.mic.2', 'tb.mic.3', 'tb.mic.4', 'tb.rec.1'], note: 'Answer the five checks (one reaches back to how the timbales sound).' },
    takeaway: 'A transducer class does not guarantee warmth, isolation, peak handling or safety from a stick. A pad after an overloaded capsule cannot repair it — check the strongest rimshot and bell.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — one mic above the pair, between the shells, under each drum, or a clip-on per drum — out of every stick path; then move the mic and see what changes.',
    credit: { scenarios: ['tb.place.1', 'tb.place.2', 'tb.place.3', 'tb.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'Top and shell positions favour different surfaces: heads and rimshots above, the cáscara near the shells. Bring in a separate mic only for a demonstrated need — and never a mic right above a rimshot target.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces the floor wedge — and know what a pattern cannot do against a ringing bell.',
    credit: { scenarios: ['tb.ctx.1', 'tb.ctx.2', 'tb.ctx.studio', 'tb.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: tilt the mic (or change its pattern) until the floor wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Place monitors by the actual pattern; a supercardioid’s rear lobe is not a cardioid’s rear null. No null or EQ move removes a nearby ringing bell at every frequency. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'With a mic on each drum, see how the arrival-time difference places comb-filter notches — and what polarity does and does not change.',
    credit: { scenarios: ['tb.two.1', 'tb.two.2', 'tb.two.3', 'tb.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Each mic hears both drums and the bell at different times. Polarity inversion is not a time-alignment control; there is no fixed “correct” polarity for every rig. Add channels one at a time, in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the part, the aim, the accessories, the gain and the open channels before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify another channel.',
    credit: { scenarios: ['k.prac.order', 'k.prac.gain', 'k.prac.setup1', 'k.prac.setup2', 'k.prac.3', 'k.mix.1', 'k.mix.2', 'k.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs real drums.' },
    takeaway: 'Safe stick clearance, correct power and gain for the strongest rimshot, a balance of heads, rims, cáscara and bell, and a mono check pass. More than one setup can pass.',
  },
};

/* Lesson refs (comments only): tb.set.* L6-L8, L24-L26 · tb.snd.* L6, LP-257 ·
 * tb.mic.* L15-L16, L25 · tb.place.* L12-L14 · tb.ctx.* L17-L23 ·
 * tb.two.* L27-L28 · practice L29-L41. */
const scenarios: MikingScenario[] = [
  {
    id: 'tb.set.1',
    page: 'setting',
    prompt: 'Before you place a stand, the player shows you their widest strokes. Which ones matter for clearance?',
    options: ['Heads, rims, shells and accessories, and moving between them', 'Only the heads, since that is where most of the strokes land', 'Only the bell, since it is the highest thing on the stand'],
    correct: 'Heads, rims, shells and accessories, and moving between them',
    explain: 'The striking envelope reaches above both heads and around the outer shells and the accessories. Keep every mic and boom outside all of it — and avoid anything that could drop onto the player.',
    why: {
      'Only the heads, since that is where most of the strokes land': 'Rimshots, the cáscara on the shells and the bell all need room too.',
      'Only the bell, since it is the highest thing on the stand': 'The bell is one target among several: heads, rims and shells need clearance too.',
    },
  },
  {
    id: 'tb.set.2',
    page: 'setting',
    prompt: 'Your timbale mic is rated to a very high maximum SPL. Does that tell you how long you can stand by the timbales through soundcheck?',
    options: ['No — that is the mic’s distortion limit, not a hearing limit', 'Yes — anything below the mic’s rating is safe for people nearby', 'Yes, as long as the mic is closer to the drums than you are'],
    correct: 'No — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Loud percussion soundchecks expose people to sound whatever the mic’s rating. A widely used guideline is no more than 85 dBA averaged over 8 hours, and every 3 dBA more halves the time — keep repetitions down.',
    why: {
      'Yes — anything below the mic’s rating is safe for people nearby': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'Yes, as long as the mic is closer to the drums than you are': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  },
  {
    id: 'tb.set.3',
    page: 'setting',
    prompt: 'A cowbell sits on the bracket between the drums. What is worth asking the player about it?',
    options: ['Whether the part uses it, and how loud it is played', 'Whether it can be taken off the stand for the show tonight', 'Which brand of bell it is, to match the mic'],
    correct: 'Whether the part uses it, and how loud it is played',
    explain: 'Ask which surfaces and mounted items occur in the whole passage. A loud bell spills into every timbale mic; reposition it only with the player’s approval.',
    why: {
      'Whether it can be taken off the stand for the show tonight': 'The setup is the player’s. Find out what the part needs before changing anything.',
      'Which brand of bell it is, to match the mic': 'No brand decides the mic. How the bell is used, and how loud, does.',
    },
  },
  {
    id: 'tb.snd.1',
    page: 'sound',
    prompt: 'A cáscara pattern is played on the side of the brass shell. What makes that sound?',
    options: ['The metal shell itself, ringing as a solid body', 'The head, pushed by the stick through the shell', 'The air leaving the open lower end'],
    correct: 'The metal shell itself, ringing as a solid body',
    explain: 'The head is the membrane part; the shell and the rim are solid-body sounds that need capturing when the part uses them.',
    why: {
      'The head, pushed by the stick through the shell': 'The stick on the shell sets the shell ringing; the head is a different source.',
      'The air leaving the open lower end': 'The open end carries part of the head’s sound. The cáscara is the metal shell ringing.',
    },
  },
  {
    id: 'tb.snd.2',
    page: 'sound',
    prompt: 'A rimshot strikes the head and the rim together. What does the simplified head picture show of it?',
    options: ['The head driven near its edge — not the rim’s own ring', 'Everything: the rim and the head ring as one surface', 'Nothing: a rimshot lands on the rim and misses the head'],
    correct: 'The head driven near its edge — not the rim’s own ring',
    explain: 'Near the edge the head’s shapes with still lines across it are driven; the metal rim adds its own ring, which this membrane model does not cover.',
    why: {
      'Everything: the rim and the head ring as one surface': 'The rim is metal and rings on its own; the head model shows only the head.',
      'Nothing: a rimshot lands on the rim and misses the head': 'A rimshot strikes the head and the rim together.',
    },
  },
  {
    id: 'tb.snd.3',
    page: 'sound',
    prompt: 'Where does part of a timbale’s head sound leave, besides from the top of the head?',
    options: ['Through the open lower end of the shell', 'Through the cowbell on the bracket', 'Nowhere — the shell is closed underneath'],
    correct: 'Through the open lower end of the shell',
    explain: 'The head pushes the air in the shallow shell down and out of the open lower end — which is why one engineer mics the pair from beneath.',
    why: {
      'Through the cowbell on the bracket': 'The bell is a separate instrument that spills into the mics; it does not carry the head’s sound.',
      'Nowhere — the shell is closed underneath': 'Timbale shells are open at the bottom.',
    },
  },
  {
    id: 'tb.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A shared mic above the heads loses the cáscara. Why might that be?',
    options: ['The cáscara is the shell ringing, off to the side of the mic', 'The cáscara leaves only through the open lower end', 'The cáscara is too quiet for a mic above the heads to pick up'],
    correct: 'The cáscara is the shell ringing, off to the side of the mic',
    explain: 'A top mic faces the heads; the shell rings at the side. Try a safe sideward aim toward the active shell area, or a separate mic nearer the shells.',
    why: {
      'The cáscara leaves only through the open lower end': 'The shell itself rings; it radiates from its sides.',
      'The cáscara is too quiet for a mic above the heads to pick up': 'It is often clearly audible; the mic’s aim and position decide how much it hears.',
    },
  },
  {
    id: 'tb.mic.1',
    page: 'microphone',
    prompt: 'The only spare input has no phantom power. Which of this page’s mic types can you still use?',
    options: ['The two compact dynamics: neither needs power', 'The clip-on mic, since it is so small and light', 'The slim condenser, if you keep it farther away'],
    correct: 'The two compact dynamics: neither needs power',
    explain: 'Dynamic mics need no power. The clip-on mic and the slim condenser are condensers and need phantom power.',
    why: {
      'The clip-on mic, since it is so small and light': 'Size does not decide power: the clip-on mic is a condenser and needs phantom power through its adapter.',
      'The slim condenser, if you keep it farther away': 'Distance does not change what a condenser needs: it still needs phantom power.',
    },
  },
  {
    id: 'tb.mic.2',
    page: 'microphone',
    prompt: 'A sharp rimshot distorts. You add a pad on the desk channel. Is it fixed?',
    options: ['Not if the mic’s capsule is overloading — a later pad cannot repair it', 'Yes — a pad on the desk channel removes the distortion that came before it', 'Yes, as long as the fader is also pulled down a little'],
    correct: 'Not if the mic’s capsule is overloading — a later pad cannot repair it',
    explain: 'Set gain and pads for the strongest real rimshot and bell, checking the mic, the preamp and later stages. A pad after an overloaded capsule cannot repair distortion made there.',
    why: {
      'Yes — a pad on the desk channel removes the distortion that came before it': 'A pad lowers what reaches the next stage; it cannot undo distortion that already happened in the mic.',
      'Yes, as long as the fader is also pulled down a little': 'The fader comes later still: it makes distortion quieter, not cleaner.',
    },
  },
  {
    id: 'tb.mic.3',
    page: 'microphone',
    prompt: 'Is a clip-on mic automatically safer on a timbale than a stand mic?',
    options: ['No — it can be struck, pass on vibration or loosen', 'Yes — a clip keeps the mic out of the stick path', 'Yes — a clip-on mic is too small to be hit'],
    correct: 'No — it can be struck, pass on vibration or loosen',
    explain: 'A clip-on is not automatically safer: it can contact a stick, transfer vibration or loosen a mount. Use compatible clips only, with permission, and recheck after the full passage.',
    why: {
      'Yes — a clip keeps the mic out of the stick path': 'Where it is clipped decides that — and a rim is close to rimshots.',
      'Yes — a clip-on mic is too small to be hit': 'Small mics can still be struck; check every stroke.',
    },
  },
  {
    id: 'tb.mic.4',
    page: 'microphone',
    prompt: 'A compact dynamic is suggested for close stage work, a condenser for a broader view. What decides the choice?',
    options: ['The model’s pattern, size, mount, power and peak level for this job', 'The type alone: dynamics are rugged and condensers are more natural', 'The brand the band used on its last tour'],
    correct: 'The model’s pattern, size, mount, power and peak level for this job',
    explain: 'Use actual model specifications. A transducer class does not guarantee warmth, isolation, resilience to every peak or safety from a stick.',
    why: {
      'The type alone: dynamics are rugged and condensers are more natural': 'Those are stereotypes to test. The specific model’s properties decide.',
      'The brand the band used on its last tour': 'A tour case shows one workable choice, not a rule.',
    },
  },
  {
    id: 'tb.place.1',
    page: 'placement',
    prompt: 'In your one shared mic, the 15 in drum dominates the 14 in. What do you try first?',
    options: ['Shift or aim the mic toward the quieter drum, then listen', 'Turn the gain up until the 14 in comes through', 'Ask the player to play the 15 in more softly'],
    correct: 'Shift or aim the mic toward the quieter drum, then listen',
    explain: 'Moving a mic toward one drum tends to raise that drum relative to the other. If one mic still cannot balance them, use separate spots.',
    why: {
      'Turn the gain up until the 14 in comes through': 'Gain lifts both drums together; the balance stays the same.',
      'Ask the player to play the 15 in more softly': 'The part is the player’s. Balance it with the mic’s position.',
    },
  },
  {
    id: 'tb.place.2',
    page: 'placement',
    prompt: 'Where should a mic NOT go, whatever it sounds like?',
    options: ['Immediately above a common rimshot target', 'Above the pair on the audience side', 'Between the shells on the audience side'],
    correct: 'Immediately above a common rimshot target',
    explain: 'A rimshot target is in the stick path: a mic there will be struck. Start outside the whole stick arc.',
    why: {
      'Above the pair on the audience side': 'That is a recommended starting region, outside the stick path.',
      'Between the shells on the audience side': 'That is another starting region one engineer uses — if the mount is secure.',
    },
  },
  {
    id: 'tb.place.3',
    page: 'placement',
    prompt: 'A band engineer puts a mic “right between the shells”. Can you copy that exactly?',
    options: ['Only as a starting idea — no distance or aim was published', 'Yes — a mic wedged between the shells sounds the same as theirs', 'Yes — it guarantees the heads and the cáscara together'],
    correct: 'Only as a starting idea — no distance or aim was published',
    explain: 'The account documents a between-shell mic, not its pattern, distance or aim. Try it as a perspective on the shell area, and check that the heads and rimshots stay usable.',
    why: {
      'Yes — a mic wedged between the shells sounds the same as theirs': 'An arbitrary mic wedged there is not equivalent — or necessarily safe or secure.',
      'Yes — it guarantees the heads and the cáscara together': 'It can favour the cáscara; check the heads and rimshots by ear.',
    },
  },
  {
    id: 'tb.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · You move a stand to reach a new zone. What must the mic, boom and cable stay clear of?',
    options: ['Every stick stroke: heads, rims, shells, bell', 'The front of the pair, so the audience can see', 'The bell only, as it is the loudest thing there'],
    correct: 'Every stick stroke: heads, rims, shells, bell',
    explain: 'Stop the player, move the stand, and keep everything outside the whole striking envelope — and away from anything that could drop onto the player.',
    why: {
      'The front of the pair, so the audience can see': 'How it looks is not the safety question. The stick envelope is.',
      'The bell only, as it is the loudest thing there': 'Every surface the sticks reach needs clearance, not only the bell.',
    },
  },
  {
    id: 'tb.ctx.1',
    page: 'context',
    prompt: 'Live, a percussion overhead covers the bells. Does it belong in the player’s wedge mix?',
    options: ['Not necessarily — decide monitor feeds with the system operator', 'Yes — each open mic on stage belongs in the player’s own wedge mix', 'Yes, as long as the wedge is turned down a little'],
    correct: 'Not necessarily — decide monitor feeds with the system operator',
    explain: 'An overhead useful for a recording or the main PA may be unnecessary or a problem in a nearby wedge. Decide monitor feeds with the operator, and never provoke feedback.',
    why: {
      'Yes — each open mic on stage belongs in the player’s own wedge mix': 'Each mic in a wedge mix adds feedback risk and spill. Send only what the player needs.',
      'Yes, as long as the wedge is turned down a little': 'Turning down helps, but the first question is whether the feed is needed at all.',
    },
  },
  {
    id: 'tb.ctx.2',
    page: 'context',
    prompt: 'A loud bell rings close to the timbale mic. Will a cardioid’s null, or an EQ cut, remove it?',
    options: ['Not at every frequency — reposition with the player, or mic it separately', 'Yes — aim the null at the bell and it disappears', 'Yes — one narrow EQ cut on the timbale channel removes the bell completely'],
    correct: 'Not at every frequency — reposition with the player, or mic it separately',
    explain: 'No cardioid null or EQ move removes a nearby ringing bell at every frequency. Discuss its position with the player, re-aim, or give it independent pickup only if justified.',
    why: {
      'Yes — aim the null at the bell and it disappears': 'Real nulls are shallow and change with pitch; a close, loud bell still spills.',
      'Yes — one narrow EQ cut on the timbale channel removes the bell completely': 'A bell has many frequencies, shared with the drums; a cut cannot remove it alone.',
    },
  },
  {
    id: 'tb.ctx.studio',
    page: 'context',
    prompt: 'Studio, extensive percussion. When does a separate shell or overhead mic earn its channel?',
    options: ['When the shell part or the bells cannot be balanced otherwise', 'Whenever a channel is spare on the desk for it', 'When the engineer wants more options later'],
    correct: 'When the shell part or the bells cannot be balanced otherwise',
    explain: 'Establish the timbale sound alone first, then add an optional shell or overhead channel only for a demonstrated need — checking mono, duplicated bell pickup and bleed.',
    why: {
      'Whenever a channel is spare on the desk for it': 'A spare channel is not a reason: every open mic adds overlapping pickup.',
      'When the engineer wants more options later': 'Options come at a cost in spill and interaction; add a mic for a real need.',
    },
  },
  {
    id: 'tb.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Which part of the timbale sound is a solid-body metal sound, not the head?',
    options: ['The cáscara on the shell, and the rim', 'The open tone of the 15 in head', 'The air leaving the open lower end'],
    correct: 'The cáscara on the shell, and the rim',
    explain: 'The head is the membrane; the shell and the rim are solid-body contributions — and the bell is a separate instrument altogether.',
    why: {
      'The open tone of the 15 in head': 'That is the membrane — the head itself.',
      'The air leaving the open lower end': 'That carries part of the head’s sound.',
    },
  },
  {
    id: 'tb.two.1',
    page: 'twoMic',
    prompt: 'You flip the polarity of mic B. What happens to the arrival-time difference?',
    options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so the two arrivals now line up in time again', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Electrical polarity inversion is not a time-alignment control. It reverses the sign; the delay stays.',
    why: {
      'It drops to zero, so the two arrivals now line up in time again': 'Flipping polarity changes the sign, not when the sound arrives.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  },
  {
    id: 'tb.two.2',
    page: 'twoMic',
    prompt: 'The 15 in mic hears a 14 in stroke 1 ms after the 14 in’s own mic. Summed at equal level, same polarity: the first notch (simplified model)?',
    options: ['500 Hz, then 1.5 kHz, 2.5 kHz …', '1 kHz, then 2 kHz, 3 kHz, 4 kHz …', '250 Hz, then 750 Hz, 1.25 kHz …'],
    correct: '500 Hz, then 1.5 kHz, 2.5 kHz …',
    explain: 'The first cancellation is where the delay is half a period: f = 1 ÷ (2 × 0.001 s) = 500 Hz, then odd multiples. Inverted, the notches sit at 0, 1 kHz, 2 kHz … instead.',
    why: {
      '1 kHz, then 2 kHz, 3 kHz, 4 kHz …': 'That is the INVERTED set (whole multiples of 1 ÷ Δt). Same polarity cancels where the delay is half a period: 500 Hz.',
      '250 Hz, then 750 Hz, 1.25 kHz …': 'That needs a 2 ms delay. With 1 ms the first notch is at 1 ÷ (2 × 0.001 s) = 500 Hz.',
    },
  },
  {
    id: 'tb.two.3',
    page: 'twoMic',
    prompt: 'Is there a “correct” polarity for every timbale rig?',
    options: ['No — compare both states at matched level, in mono', 'Yes — the larger, lower drum’s mic is the inverted one', 'Yes — whichever state sounds louder at first'],
    correct: 'No — compare both states at matched level, in mono',
    explain: 'No fixed “correct” polarity exists for all timbale rigs. Move or re-aim first, then compare the switch as a check.',
    why: {
      'Yes — the larger, lower drum’s mic is the inverted one': 'There is no such rule; it depends on the geometry and the rig.',
      'Yes — whichever state sounds louder at first': 'Louder almost always sounds better at first. Match levels before judging.',
    },
  },
  {
    id: 'tb.two.4',
    page: 'twoMic',
    prompt: 'With two spots, the bell has become surprisingly prominent. Why might that be?',
    options: ['Both mics hear the bell, and their sum adds it up', 'The polarity switch makes the bell louder', 'A second mic doubles the level of both drums and the bell'],
    correct: 'Both mics hear the bell, and their sum adds it up',
    explain: 'With a pair of spots, each mic hears both drums and the accessories. Add mics one at a time, check the whole phrase in mono, and watch the bell.',
    why: {
      'The polarity switch makes the bell louder': 'Polarity changes how arrivals add, but the cause is the bell reaching both mics.',
      'A second mic doubles the level of both drums and the bell': 'It adds overlapping pickup — of the bell too — not a fixed doubling.',
    },
  },
  {
    id: 'k.prac.gain',
    page: 'practice',
    prompt: 'Typical strokes sit well below the overload light, but the strongest rimshot and the bell light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader well down until the loudest rimshots sound clean', 'Ask the player to play the rimshots softer during the show'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set gain and any pad on the strongest real rimshot and bell, checking the mic, the preamp and later stages for distortion.',
    why: {
      'Pull the channel fader well down until the loudest rimshots sound clean': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the player to play the rimshots softer during the show': 'Set gain for the strongest strokes the player intends to play.',
    },
  },
  {
    id: 'k.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a shell or overhead mic to a shared timbale mic?',
    options: ['A part or bell the shared mic cannot balance, and a mono sum that holds', 'Two extra channels give the mix engineer more options to work with later', 'The timbales need more level than one mic can give'],
    correct: 'A part or bell the shared mic cannot balance, and a mono sum that holds',
    explain: 'Bring channels in only when they solve a demonstrated coverage or control problem; check mono, accessory balance and feedback.',
    why: {
      'Two extra channels give the mix engineer more options to work with later': 'Every additional open mic captures overlapping sources and stage spill.',
      'The timbales need more level than one mic can give': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'k.mix.1',
    page: 'practice',
    prompt: 'A starting point says “beneath the drums, pointing out toward the rims”. What else do you check before using it live?',
    options: ['The stand legs and feet, and whether it suits a crowded stage', 'The brand of the timbales, so the angle matches them', 'Nothing more — that wording already places the mic exactly where it goes'],
    correct: 'The stand legs and feet, and whether it suits a crowded stage',
    explain: 'It is one engineer’s studio preference, not a safe default for a crowded stage. Check clearance and stability before anything else.',
    why: {
      'The brand of the timbales, so the angle matches them': 'Brands do not set placement; clearance and the job do.',
      'Nothing more — that wording already places the mic exactly where it goes': 'It names a region and an aim, not a distance; clearance and listening finish the job.',
    },
  },
  {
    id: 'k.mix.2',
    page: 'practice',
    prompt: 'Your floor wedge sits about 110° off a hypercardioid’s front axis. What can you expect?',
    options: ['Strong rejection on paper; less in reality, least in the lows', 'Silence from the wedge, because it sits in the null', 'More pickup than from straight behind, where it rejects the most'],
    correct: 'Strong rejection on paper; less in reality, least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies.',
    why: {
      'Silence from the wedge, because it sits in the null': 'A null is infinitely deep only on paper. Real mics reject far less, and least in the lows.',
      'More pickup than from straight behind, where it rejects the most': 'Straight behind, a hypercardioid has a rear lobe; its deepest rejection is off the rear axis.',
    },
  },
  {
    id: 'k.mix.3',
    page: 'practice',
    prompt: 'Two timbale mics sound thin together. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning the later mic up until it matches the earlier one'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the later mic up until it matches the earlier one': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  },
];

/* The lesson's troubleshooting table (L33-L39). */
const symptoms: Symptom[] = [
  {
    id: 's.one',
    observation: 'One drum dominates',
    firstChecks: 'Shared aim and the player’s dynamics.',
    options: ['The shared mic’s aim and the player’s dynamics', 'Boost the quieter drum’s frequencies with EQ', 'Swap the drums so the quiet one is nearer the mic'],
    correct: 'The shared mic’s aim and the player’s dynamics',
    explain: 'Shift or aim toward the quieter drum, or use separate spots if necessary.',
    why: {
      'Boost the quieter drum’s frequencies with EQ': 'The drums share frequencies; move the mic first.',
      'Swap the drums so the quiet one is nearer the mic': 'The setup is the player’s. Move the mic.',
    },
  },
  {
    id: 's.cascara',
    observation: 'The cáscara vanishes beneath the heads',
    firstChecks: 'Is the mic aimed only at the top heads; where is the shell struck?',
    options: ['Where the shell is struck, and whether the mic faces only the heads', 'Turn the whole timbale channel up until the cáscara can be heard again', 'Ask the player to hit the shell much harder'],
    correct: 'Where the shell is struck, and whether the mic faces only the heads',
    explain: 'Try a safe sideward or shell perspective and assess the trade-off with the heads.',
    why: {
      'Turn the whole timbale channel up until the cáscara can be heard again': 'Level lifts the heads too; the balance stays wrong.',
      'Ask the player to hit the shell much harder': 'The part is the player’s. Move or aim the mic.',
    },
  },
  {
    id: 's.bell',
    observation: 'A bell or cymbal overwhelms the drums',
    firstChecks: 'Accessory placement, mic aim, other open channels.',
    options: ['The accessory’s position, the mic’s aim and the other open mics', 'Aim a null at the bell and expect it to disappear from the channel', 'Cut the high frequencies until the bell is gone'],
    correct: 'The accessory’s position, the mic’s aim and the other open mics',
    explain: 'Discuss the accessory’s position with the player; re-aim, or add independent pickup only if justified.',
    why: {
      'Aim a null at the bell and expect it to disappear from the channel': 'Real nulls are shallow and change with pitch; a nearby bell still spills.',
      'Cut the high frequencies until the bell is gone': 'A cut also dulls the drums; the bell shares their frequencies.',
    },
  },
  {
    id: 's.distort',
    observation: 'A sharp rimshot distorts',
    firstChecks: 'Mic rating, pad location, preamp gain, actual peak.',
    options: ['The mic’s rating, where the pad is, the gain and the real peak', 'Pull the channel fader well down until the rimshot sounds clean', 'Ask the player to leave the rimshots out'],
    correct: 'The mic’s rating, where the pad is, the gain and the real peak',
    explain: 'Reduce input gain or use the appropriate pre-capsule pad or model per the manual; recheck the strongest hits.',
    why: {
      'Pull the channel fader well down until the rimshot sounds clean': 'The fader comes after the distortion; it only makes it quieter.',
      'Ask the player to leave the rimshots out': 'The rimshots are part of the music. Set the gain for them.',
    },
  },
  {
    id: 's.mono',
    observation: 'The full setup becomes thin in mono',
    firstChecks: 'Overlapping timbale, shell, accessory and overhead channels.',
    options: ['Solo and reintroduce one channel at a time; move or aim first', 'Invert the second timbale channel and each overhead to be safe', 'Turn all the channels up together'],
    correct: 'Solo and reintroduce one channel at a time; move or aim first',
    explain: 'Solo and reintroduce one at a time; move or aim before comparing polarity.',
    why: {
      'Invert the second timbale channel and each overhead to be safe': 'There is no fixed correct polarity; compare each state at matched level.',
      'Turn all the channels up together': 'More level does not fix a cancellation.',
    },
  },
  {
    id: 's.struck',
    observation: 'A mic or cable is struck',
    firstChecks: 'The full head, shell and accessory stick paths.',
    options: ['Stop, mute, secure and move the rig; repeat the clearance check', 'Keep going carefully and fix the mount once the song has finished', 'Ask the player to play around the mic'],
    correct: 'Stop, mute, secure and move the rig; repeat the clearance check',
    explain: 'Clearance comes first: stop before anything moves, and recheck after the full-intensity passage.',
    why: {
      'Keep going carefully and fix the mount once the song has finished': 'Clearance comes first: stop before any mic moves.',
      'Ask the player to play around the mic': 'Never ask the player to play around the mic. Move it.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'k.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic setup in the order you would do them.',
    steps: [
      { text: 'Ask the player: which surfaces and accessories the part uses, and where they strike', early: 'Start with the player and the part.' },
      { text: 'Choose a mic whose pattern, power, size, mount and peak level suit the job', early: 'Choose the mic once you know the part and the accessories.' },
      { text: 'Have the player stop; mount the mic; check clearance from every stick path', early: 'You need a chosen mic before you can mount it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is mounted and its cable connected — with the outputs muted first.' },
      { text: 'Set input gain on the strongest rimshot and bell, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare positions one change at a time, at matched levels', early: 'Compare only once the level is set safely — and at matched levels, so louder does not win.' },
      { text: 'Keep the simplest setup that works, with safe clearance', early: 'Decide last, after comparing.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it on the strongest real rimshot and bell.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'This input gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point for this kind of mic, for the surfaces the part uses', role: 'required', feedback: 'Say why it is a good place to begin, and which surfaces it favours.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, mount and cable stay out of every stick path', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on timbales', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const BASS_REASON: SetupReason = { id: 'r.bass', label: 'It will give the most bass of any position on the pair', role: 'wrong', feedback: 'Bass emphasis is not a passing reason, and no position always gives the most bass.' };

const setupTasks: SetupTask[] = [
  {
    id: 'k.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Timbales with a bell, a studio session with other percussion, limited channels. The part uses heads, rimshots and a steady cáscara. Phantom power is available.',
    setups: [
      { id: 'a', label: 'One compact dynamic above and between the heads, aimed down', ok: true, power: 'none', feedback: 'A recommended starting point with the fewest channels; check the cáscara and the bell in it.' },
      { id: 'b', label: 'A compact dynamic right between the shells, on the audience side', ok: true, power: 'none', feedback: 'A starting idea that can favour the cáscara; check that the heads and rimshots stay usable.' },
      { id: 'c', label: 'A clip-on condenser on each drum’s far rim, with the player’s OK', ok: true, power: 'phantom', feedback: 'Independent control; it needs the phantom power this input has. Check the bell in both.' },
      { id: 'd', label: 'A mic just above a rimshot target on the player’s side', ok: false, power: 'none', feedback: 'That is in the stick path: it will be struck.' },
      { id: 'e', label: 'A mic taped to the shell where the cáscara is played', ok: false, power: 'none', feedback: 'That is the shell-strike zone, and nothing is mounted to the instrument without the right hardware and permission.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.balance', label: 'It can balance heads, rimshots, cáscara and bell for this part', role: 'optional', feedback: 'A fair reason to state.' }, BRAND_REASON, BASS_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point for the surfaces used, clearance, and power that matches the mic.',
  },
  {
    id: 'k.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage with a floor wedge in front of the timbales; a crowded percussion area. The spare inputs have NO phantom power.',
    setups: [
      { id: 'a', label: 'A compact dynamic spot on each drum, outside the stick path', ok: true, power: 'none', feedback: 'Close, directional, independent control on a loud stage; dynamics need no phantom.' },
      { id: 'b', label: 'One compact dynamic above and between the heads, aimed down', ok: true, power: 'none', feedback: 'A recommended starting point; a dynamic needs no phantom.' },
      { id: 'c', label: 'A clip-on condenser on each rim', ok: false, power: 'phantom', feedback: 'It needs phantom power these inputs lack.' },
      { id: 'd', label: 'A small-condenser pair a metre above the drums', ok: false, power: 'phantom', feedback: 'Distant on a loud stage, and it needs phantom power.' },
      { id: 'e', label: 'Two dynamics beneath the drums among the stand legs', ok: false, power: 'none', feedback: 'One engineer’s studio preference — not a safe default for a crowded stage.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against stage spill and feedback', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'Two close, dynamic setups pass. What passes is the reasoning: a sensible starting point, clear of every stick, powered by what these inputs can supply.',
  },
];

const predictions: HandLesson['predictions'] = {
  sound: { prompt: 'Before you step through: the stick pushes the head down. Where does the air in the shallow shell go?', options: ['Down and out of the open end', 'Up, back out through the head', 'Into the cowbell'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the air.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from above the heads to between the shells. What changes?', options: ['More cáscara, less head', 'More head, less cáscara', 'Nothing — it is the same pair'], after: 'Near the shells the cáscara tends to rise against the heads — a tendency to check by ear, with the whole phrase.' },
  context: { prompt: 'Where can this mic, aimed at the 15 in head, best reject the floor wedge in front?', options: ['Straight behind the mic', 'Toward its rear, off to one side', 'At the sides of the mic'], after: 'Now tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is a timbale?',
    options: ['A shallow, single-headed drum, played with sticks', 'A deep drum with a head on each end', 'A hand drum held between the knees'],
    correct: 'A shallow, single-headed drum, played with sticks',
    explain: 'Timbales are a pair of shallow single-headed drums on a stand, played with sticks on the heads, rims and shells.',
    why: {
      'A deep drum with a head on each end': 'Timbales are shallow and open at the bottom: one head each.',
      'A hand drum held between the knees': 'That describes bongos. Timbales stand on a stand and are played with sticks.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What is the cáscara?',
    options: ['A pattern played on the side of the shell', 'The head of the larger drum', 'The bracket that holds the bell'],
    correct: 'A pattern played on the side of the shell',
    explain: 'Players strike the metal shells for cáscara patterns.',
    why: {
      'The head of the larger drum': 'The cáscara is played on the shell, not the head.',
      'The bracket that holds the bell': 'That is the cowbell bracket. The cáscara is played on the shell.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'The stick strikes the brass shell. Which part rings?',
    options: ['The metal shell, a solid-body sound', 'The head, through the shell', 'Only the air in the shell'],
    correct: 'The metal shell, a solid-body sound',
    explain: 'The shell and rim are solid-body contributions; the head is the membrane.',
    why: {
      'The head, through the shell': 'The shell rings on its own; the head is a different source.',
      'Only the air in the shell': 'The metal shell itself rings.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'The stick pushes the head down. Where is the air in the shell pushed?',
    options: ['Down and out of the open lower end', 'Up and back out through the head', 'Nowhere — the air stays still'],
    correct: 'Down and out of the open lower end',
    explain: 'The head moving down pushes the air in the shallow shell out of the open lower end.',
    why: {
      'Up and back out through the head': 'The head is moving down, into the shell: it pushes the air down.',
      'Nowhere — the air stays still': 'The moving head pushes the air in front of it.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Where must a timbale mic, its boom and cable stay out of?',
    options: ['Every stick path: heads, rims, shells and bell', 'The front of the pair, out of the audience’s view', 'The space under the stand, to keep it level'],
    correct: 'Every stick path: heads, rims, shells and bell',
    explain: 'The striking envelope reaches above both heads and around the shells and accessories.',
    why: {
      'The front of the pair, out of the audience’s view': 'How it looks is not the question; the stick envelope is.',
      'The space under the stand, to keep it level': 'Keep stands stable, but the space that moves is the sticks’.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your mic is rated to a very high maximum SPL. What does that tell you about standing by the timbales through a long soundcheck?',
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe while the drums stay below the mic’s rating', 'It is safe as long as the mic is nearer the drums than you'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe while the drums stay below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is nearer the drums than you': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  },
];

const IN = 25.4;
const zoneStart = (id: string) => TIMB_ZONES.find((z) => z.id === id)!.start;

export const M04C_LESSON: HandLesson = {
  id: 'M04c',
  labId: 'drums',
  title: 'Timbales',
  subtitle: 'Heads, rims and shells: one mic above, spots, or under',
  noun: { one: 'pair of timbales', many: 'timbales' },
  copy: handCopy(TIMB_WORDS),
  model: TIMB_MODEL,
  micTypeIds: ['hdDynCard', 'hdDynHyper', 'hdSdc', 'hdClip'],
  zones: TIMB_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT THEY ARE', text: 'Timbales are a pair of shallow, single-headed drums on a stand, played with sticks. Here, 14 and 15 in brass shells, 6½ in deep, open at the bottom.', src: 'LP-257' },
    { title: 'WHERE YOU MEET THEM', text: 'In Latin and Afro-Cuban music and popular music beyond it, in the studio and on stage, often in a percussion setup with bells, blocks or a cymbal on the same stand.', src: 'LESSON' },
    { title: 'WHAT THEY DO IN THE MUSIC', text: 'Drum tones and accents on the heads and rims, and the cáscara pattern on the metal shells — plus whatever the mounted bell or block plays. Ask which surfaces the part uses.', src: 'LP-257' },
    { title: 'THEIR SIZE', text: 'Common pairs run around 13 to 15 in across. This lab draws a 14 in and a 15 in drum, 6½ in deep, at a typical playing height.', src: 'LP-257' },
  ],
  sound: {
    stages: [
      { title: 'The stick strikes', text: 'The stick strikes the head — or the head and the rim together for a rimshot, or the shell’s side for the cáscara. That brief contact is where the ATTACK begins.' },
      { title: 'The head is pushed in', text: 'The head bows down into the drum — most at the centre, not at all at the rim: its lowest vibration shape, drawn here many times larger than it really moves. Then it springs back and rings.' },
      { title: 'The air is pushed down', text: 'The head pushes the air in the shallow shell down and out of the open lower end.' },
      { title: 'Sound leaves the drum', text: 'Sound leaves from the head — up and around — and from the open lower end. The metal shell and rim ring on their own when struck: different surfaces, different perspectives.' },
    ],
    attack: 'The start of the sound: the stick’s brief contact with the head, the rim or the shell. A mic tends to hear more of the surface it is near and facing — the heads from above, the cáscara near the shells.',
    body: 'The ringing that follows: the head and the air in the shallow shell, and the metal shell and rim when they are struck. A loud bell on the bracket rings into every mic too. Tendencies to check by ear.',
    head: { diameterMm: 14 * IN, rods: D.lugs.mm, label: '14 in timbale head, seen from above', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'drums', label: 'the timbales (the same drawing as every other page)', short: 'TIMBALES', note: 'The 14 in on the player’s left, the 15 in on the right, on their stand — with a cowbell on the bracket here.', prov: { kind: 'sourced', src: 'LP-257', quote: '14″ & 15″ diameter, 6-1/2″ deep' }, tag: 'THE DRUMS', scene: 'all' },
      { id: 'player', label: 'the player, standing with sticks', short: 'PLAYER', note: 'The sticks reach above both heads, round the shells and to the bell; the player moves between instruments. Nothing of yours goes there, or where it could drop onto them.', prov: { kind: 'illustrative', reason: 'a standing player; no source gives the reach' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'kit', label: 'the drum kit', short: 'DRUM KIT', note: 'A loud neighbour; its cymbals in particular reach a timbale mic.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'SPILL', scene: 'all' },
      { id: 'bass', label: 'the bass amp', short: 'BASS AMP', note: 'Low-frequency spill into the timbale mics.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'SPILL', scene: 'all' },
      { id: 'perc', label: 'other percussion (congas, more bells)', short: 'PERCUSSION', note: 'Bells, blocks and cymbals may be louder than the heads and enter several mics; the player moves between them.', prov: { kind: 'illustrative', reason: 'a typical percussion setup; no source gives positions' }, tag: 'SPILL', scene: 'all' },
      { id: 'vox', label: 'a vocal mic', short: 'VOCAL MIC', note: 'Another open mic that hears the timbales and the bell.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'OPEN MIC', scene: 'all' },
      { id: 'wedge', label: 'the player’s floor wedge', short: 'WEDGE', note: 'In front of the player, facing them — below and in front of a mic aimed at a head.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'sidefill', label: 'a side fill', short: 'SIDE FILL', note: 'A loud monitor at the side of the stage.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'A mono PA or an off-axis audience may need a shared or centred timbale feed even if separate mics exist.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet studio a shared mic above the pair hears the room and the accessories too — add a spot only for a real need.', prov: { kind: 'illustrative', reason: 'a generic room; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a floor wedge, the kit and cymbals, other percussion and the PA. Compact directional spots or a well-placed shared close mic, safely mounted; any percussion overhead kept out of an unnecessary wedge mix.',
    studio: 'STUDIO: a shared mic above the pair at a safe distance, moved until heads, rimshots and cáscara have a usable relationship — then a separate spot or overhead only where the bell or the shell part needs it.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for given timbales and a given part, describe an alternative, and explain what would justify another channel. With real drums and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'drum', label: 'Drums (sizes, side, accessories)', kind: 'text' },
      { id: 'surfaces', label: 'Surfaces the part uses', kind: 'choice', choices: ['heads', 'heads and rims', 'heads, rims and cáscara', 'with a bell'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['compact dynamic', 'small condenser', 'clip-on condenser', 'other'] },
      { id: 'pattern', label: 'Pattern', kind: 'text' },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from which head or edge', kind: 'text' },
      { id: 'aim', label: 'Aim', kind: 'text' },
      { id: 'notes', label: 'What you heard: heads, rims, cáscara, bell (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The heads’ height on the stand, the drums’ plan spacing and which side the smaller drum sits — drawing defaults.', dims: ['headH', 'spacing'] },
    { text: 'The rims and the number of lugs — drawing defaults, never stated.', dims: ['rimRise', 'rimT', 'lugs'] },
    { text: 'The bracket, and the cowbell’s size and position — drawing defaults.', dims: ['bellX', 'bellUp'] },
    { text: 'The sticks’ envelope — ILLUSTRATIVE, for the owner to approve.', dims: ['sticksUp'] },
    { text: 'No source gives a timbale mic distance: the “just above” and “beneath” bands are drawing defaults; the between-shell mic’s distance and aim were never published.', dims: [] },
    { text: 'The head material is not given by the source; a plain film is drawn.', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'wedge', label: 'the player’s floor wedge, in front of the pair, facing them', short: 'WEDGE', p: { x: 1050, y: 0, z: 0 }, lift: 150, faces: { x: -1, y: 0, z: 0 }, note: 'Below and in front of a mic aimed at a head — where an off-axis null can help.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
      { id: 'sidefill', label: 'a side fill at the side of the stage, facing across', short: 'SIDE FILL', p: { x: -250, y: 0, z: -1900 }, lift: 1100, faces: { x: 0, y: 0, z: 1 }, note: 'Off to the side of the mic: one null cannot face every monitor — distance, level and fewer open mics matter too.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. No published source gives a timbale mic distance, so the starting points here are regions to begin in: out of every stick path, then listen. Every pair, part and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: mic patterns and the two-mic comb as textbook shapes, and head motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  hand: {
    drum: SMALL,
    drums: { small: SMALL, large: LARGE },
    shellLook: 'brass',
    headLook: 'film',
    tool: 'stick',
    variantKey: 'BELL',
    figure: { view: 'side', badge: 'A pair of timbales — 14 and 15 in, 6½ in deep — on their stand, seen from the player’s right', label: 'Side view of a pair of timbales on a stand: shallow brass shells with chrome rims, the 15 in in front and the 14 in behind it, a cowbell on a bracket above them.' },
    partsBadge: 'A pair of timbales · tap a part to name it',
    partsPrompt: 'Tap any part — or step through PART — to see what it is and what it does. Switch BELL to take the cowbell off. There is nothing to answer on this page.',
    partsNote: 'The sticks strike the heads, the rims and the brass shells; the bell rings beside them. The next page shows how.',
    soundBadge: 'The order of events, not their speed · head motion drawn much larger than it really is · silent',
    faceLabel: 'the 14 in head',
    strikeWord: 'STICK',
    face: { kind: 'crown', lugs: D.lugs.mm },
    facePoints: [
      { id: 'c', label: 'CENTRE', frac: 0, blurb: 'The exact centre of the head.' },
      { id: 'h', label: 'HALFWAY', frac: 0.5, blurb: 'Halfway from the centre to the rim.' },
      { id: 'e', label: 'NEAR THE RIM', frac: 0.9, blurb: 'Close to the rim, where a rimshot lands.' },
    ],
    openEnd: { default: true },
    strokes: {
      key: 'STICK ON',
      title: 'Head, rim and shell',
      intro: 'Switch STICK ON between the head, a rimshot and the shell. The bars are the head’s physics; the rim and the shell ring on their own.',
      badge: 'A simplified head · the stick drawn at a typical spot · bars = how strongly that spot drives each head shape',
      items: [
        { id: 'head', label: 'THE HEAD', short: 'HEAD', frac: 0.5, tool: 'stick', text: 'The stick on the head: the drum’s tone and attack.' },
        { id: 'rim', label: 'A RIMSHOT', short: 'RIMSHOT', frac: 0.95, tool: 'stick', text: 'The stick strikes the head and the rim together: a loud accent. The head is driven near its edge; the metal rim adds a ring this head picture does not cover.' },
        { id: 'shell', label: 'THE SHELL (CÁSCARA)', short: 'CÁSCARA', frac: null, tool: 'stick', text: 'The stick on the brass shell’s side: the metal shell rings on its own. It is not the head, so no head shapes are driven here.' },
      ],
      note: 'Different surfaces, different sounds: heads and rimshots from above, the cáscara at the shells — and a bell on the bracket rings into every mic. Ask the player which surfaces the whole part uses.',
    },
    soundReveal: 'The head moving down pushes the air in the shallow shell out of the open end — and the brass shell and rim ring on their own when the stick finds them.',
    plan: {
      box: { u0: -2000, u1: 2300, v0: -1400, v1: 1300 },
      things: [
        { id: 'drums', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'player', kind: 'player', u: -500, v: 0, scene: 'all' },
        { id: 'kit', kind: 'kit', u: -1350, v: -750, scene: 'all' },
        { id: 'bass', kind: 'amp', u: -1450, v: 950, face: 0, scene: 'all' },
        { id: 'perc', kind: 'perc', u: -420, v: 880, scene: 'all' },
        { id: 'vox', kind: 'micstand', u: 640, v: -650, scene: 'all' },
        { id: 'wedge', kind: 'wedge', u: 1050, v: 0, face: Math.PI, scene: 'stage' },
        { id: 'sidefill', kind: 'sidefill', u: -250, v: -1150, face: Math.PI / 2, scene: 'stage' },
        { id: 'audience', kind: 'audience', u: 1750, v: 0, scene: 'stage' },
        { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
      ],
      badge: 'The band from above · a typical layout · the player at the left, the audience to the right',
      looking: 'Plan · the band from above · the player behind the timbales',
      prompt: 'Tap anything around the timbales — or step through ITEM — to see what it means for a timbale mic. There is nothing to answer yet.',
      intro: 'The timbales stand in front of the player, with loud neighbours around them — and a bell on their own stand. Everything near them is either the player’s stick space or a source of spill.',
      label: 'The band from above: the timbales in the middle with the player behind them, a drum kit and a bass amp behind the player, other percussion to the player’s right and a vocal mic in front.',
    },
    before: {
      ask: 'Which surfaces does the part use — heads, rims, the cáscara on the shells — and which mounted bells, blocks or cymbals? Have the player show the widest strokes and any movement between instruments, the quietest repeated cáscara and the strongest accents. Inspect rattles and secure hardware together.',
      asIs: 'The setup is the player’s: avoid changing it simply to fit a mic. Mount nothing to the instrument or the venue without the right hardware and permission, and nothing where it could drop onto the player.',
    },
    worked: { default: 'tb.shared' },
    clearWords: 'Clear of every stick stroke — over the heads, at the rims, round the shells and at the bell — and nothing where it could drop onto the player. Clearance comes first, before any number.',
    ideas: {
      hdDynCard: 'Ideas to try with this kind of mic: one mic above and between the heads first; compare higher and lower within the safe range, then a safe sideward aim toward the shell the cáscara is played on.',
      hdDynHyper: 'Ideas to try with this kind of mic: right between the shells on the audience side for more cáscara — then check the heads and rimshots stay usable. Its narrow pattern helps against a loud bell only so far.',
      hdSdc: 'Ideas to try with this kind of mic: in the studio, above the pair at a safe distance for a broader view — listen for how much bell and room comes with it.',
      hdClip: 'Ideas to try with this kind of mic: one on each drum’s far rim, out of the stick path, with the player’s OK. Check for stand or clamp noise, and the bell in both.',
    },
    placeLearn: [
      'What you just did, in words. After our research, each blue zone is a region where we recommend you begin with that kind of mic. No published source gives a timbale distance, so these are regions to begin in: out of every stick path, then listen. Starting points, not rules.',
      'The shell-oriented and above-head starting points differ because they favour different surfaces: a part mostly on heads and rimshots may suit a top mic; a continuous cáscara may need a mic nearer the shells. Change one thing at a time and ask for the whole phrase again.',
      'Clearance comes first. Stop the player before moving a stand, clamp or cable; keep every mic and boom outside the widest head, rim, shell and accessory strokes, and nothing where it could drop onto the player. The grey hatched areas show roughly where; recheck after the full-intensity passage.',
      'A separate percussion overhead — one engineer’s account puts a pair about 91–107 cm (3–3½ ft) above the drums — can cover bells and the whole setup when the part needs it. Bring each extra mic in only for a demonstrated need, and check mono.',
    ],
    context: {
      pose: { p: { x: LARGE.c.x + LARGE.R + 60, y: HEAD_Y - 150, z: LARGE.c.z }, az: 0, el: -35 },
      looking: 'Side view · a mic just beyond the 15 in’s far rim, aimed back across the head',
      prompt: 'The wedge stays where the player needs it. Tilt the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still faces the head.',
      learn: [
        { title: 'HOW MUCH ROOM', text: 'Studio: a shared mic above the pair at a safe distance, moved until heads, rimshots and cáscara relate well. Live: compact directional spots or a well-placed shared close mic.' },
        { title: 'HOW MANY MICS', text: 'Studio with extensive percussion: establish the timbale sound alone, then audition shell or overhead channels. Live: start with the essential drum channels; add an accessory channel only if needed.' },
        { title: 'WHAT THE PART NEEDS', text: 'Bells, blocks and cymbals may be louder than the heads and enter several mics. A mono PA or off-axis audience may need a centred timbale feed rather than hard-panned drums.' },
        { title: 'MOUNTING', text: 'Stable, properly rated stands and compatible clips only, cables secured with strain relief, nothing that could drop onto the player — checked again after a changeover.' },
      ],
      closing: 'One engineer’s technique does not transfer unchanged to every PA: feedback depends on the loudspeaker, microphone, room and gain. Place speakers and mics by the actual pattern, decide monitor feeds with the operator, and never provoke feedback.',
    },
    pairs: [
      {
        id: 'spots',
        label: 'A clip-on on each drum',
        blurb: 'Each mic hears its own drum — and the other one, and the bell, a little later. A 14 in stroke reaches B, on the 14 in, first; A, on the 15 in, hears it later.',
        A: { typeId: 'hdClip', pattern: 'supercardioid', pose: zoneStart('tb.clip.large') },
        B: { typeId: 'hdClip', pattern: 'supercardioid', pose: zoneStart('tb.clip.small') },
        source: 'r.small',
      },
      {
        id: 'under',
        label: 'Two dynamics beneath',
        blurb: 'One under each drum, pointing out toward its rim: each hears its own head from below — and the other drum, later.',
        A: { typeId: 'hdDynCard', pattern: 'cardioid', pose: zoneStart('tb.under.large') },
        B: { typeId: 'hdDynCard', pattern: 'cardioid', pose: zoneStart('tb.under.small') },
        source: 'r.small',
      },
    ],
    pairLearn: [
      'With a pair of spots, each mic may hear both drums and the accessories at different times and levels. Begin with one mic at a realistic level, add the second, and check the complete phrase in mono — watch for thin drum tone, shifted attacks, or a bell that becomes surprisingly prominent.',
      'Move or re-aim a mic first, then compare the polarity switch. Add any overhead, shell or accessory mic one at a time and repeat the check. In stereo, keep the image right for the arrangement — a mono PA may need a centred feed.',
      'What you just saw: sound reaches two mics at different times; summed, the delayed copy cancels where it is half a period late. Polarity inversion is not a time-alignment control: it moves the notches; it does not remove the delay. No fixed “correct” polarity exists for every rig.',
    ],
    pairWarn: 'The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the two levels, which this model takes from distance alone (1/r) — that does not hold this close to a drumhead, so read the depths as illustrative only. Judge the pair by ear, in mono, at matched levels.',
  },
};
