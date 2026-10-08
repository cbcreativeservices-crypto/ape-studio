/**
 * M04a CONGAS — the lesson's pages as DATA (blueprint §7). The words come from
 * the owner's lesson (docs/labs/miking/source_text/Congas-Miking-Technique-
 * Research.txt, cited "L<n>" in COMMENTS only) with the fixes logged in
 * docs/labs/miking/CORRECTIONS_LOG.md applied (CG-01 …).
 *
 * OWNER RULING 2026-10-04: suggested starting points, never dogma. Learner text
 * names NO source, brand or model and carries no badge — "after our research,
 * here is where we recommend you begin". The research stays in
 * docs/labs/miking/congas/ and in the code-only fields. Pinned by
 * test/mikingLearnerText.test.ts and test/mikingHandDrums.test.ts.
 *
 * The practice page is the shared PPractice: its item ids (k.prac.*, k.mix.*)
 * are that page's contract, so this lesson uses the same ids.
 */
import type { DiagnosticItem, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { OPPOSITE_SIDES_POLARITY, micRatingCheck } from '../../engine/model/sharedItems.ts';
import { handCopy, type HandLesson } from '../shared/handdrums/family.ts';
import { CONGA_MODEL, CONGA_WORDS } from './geometry.ts';
import { CONGA, CONGA_DIMS as D, CONGA_ZONES, HEAD_Y, TUMBA } from './model.ts';

const pages: LessonPages = {
  instrument: {
    title: 'Meet the congas',
    goal: 'Get to know a pair of congas — what they are, where you meet them, what they do in the music, and their parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Two tall, single-headed hand drums, open at the bottom: the head gives the hand’s attack and tone, the open lower end a deeper, boomier part. Work with the drums as the player sets them up.',
  },
  sound: {
    title: 'How they make their sound',
    goal: 'See how a hand stroke becomes sound — the head, the air in the shell, the open lower end — and how where the hand lands changes what the head does.',
    credit: { scenarios: ['cg.snd.1', 'cg.snd.2', 'cg.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The hand’s attack starts at the head. The body — the head and the air in the shell — leaves from the head and through the open lower end. A mic hears more of whichever it is closer to and faces: a tendency, and drums vary.',
  },
  setting: {
    title: 'Where they sit',
    goal: 'Know where the congas sit in a band, the player’s space, and what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['cg.set.1', 'cg.set.2', 'cg.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The space over the player’s side of the heads, and their wrists, knees and footing, is theirs: no stand, boom or cable goes through it. Live, monitors and spill shape the choice; in a studio the room may help. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for these drums by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['cg.mic.1', 'cg.mic.2', 'cg.mic.3', 'cg.mic.4', 'cg.rec.1'], note: 'Answer the five checks (one reaches back to how the congas sound).' },
    takeaway: 'Pattern, power, size and mount decide what a mic can do here. A dynamic is not automatically isolating, a condenser not automatically natural — and a mic’s maximum SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — one mic for the pair, or one per drum — measured from the right head, outside the hands; then move the mic and see what changes.',
    credit: { scenarios: ['cg.place.1', 'cg.place.2', 'cg.place.3', 'cg.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named head — not a rule. Shift toward the quieter drum, raise for a blend, move closer for directness — one change at a time, and clearance first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces the floor wedge — and know what a pattern cannot do.',
    credit: { scenarios: ['cg.ctx.1', 'cg.ctx.2', 'cg.ctx.studio', 'cg.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: tilt the mic (or change its pattern) until the floor wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most directly behind; a supercardioid or hypercardioid rejects most off the rear axis and has a rear lobe. Real nulls are shallower than the picture, and shallowest in the lows. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See how the arrival-time difference between two mics — one per drum, or top and bottom — places comb-filter notches, and what polarity does and does not change.',
    credit: { scenarios: ['cg.two.1', 'cg.two.2', 'cg.two.3', 'cg.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Each mic hears both drums at different times. Polarity flips the sign; it does not remove a delay. Judge the pair in mono, at matched levels, across every stroke.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — position, aim, clearance, gain, levels and polarity — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second channel.',
    credit: { scenarios: ['k.prac.order', 'k.prac.gain', 'k.prac.setup1', 'k.prac.setup2', 'k.prac.3', 'k.mix.1', 'k.mix.2', 'k.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs real drums.' },
    takeaway: 'Safe placement, correct power and level checks, musical reasoning and a mono check pass. A brand or a bass setting does not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS — reasoning, not recall; every wrong option a real misconception
 * of about the same length, with its own `why`. Lesson refs (comments only):
 * cg.set.* L5-L6, L19-L21 · cg.snd.* L6, WP-CONGA strokes · cg.mic.* L19-L21 ·
 * cg.place.* L8-L18 · cg.ctx.* L22-L28 · cg.two.* L29-L30 · practice L31-L38.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'cg.set.1',
    page: 'setting',
    prompt: 'You need a stand for a mic over the conga pair. Which space must its base, boom and cable stay out of?',
    options: ['The player’s hands, wrists and knees, and their footing', 'The front of the drums, so the audience can see them clearly', 'The area behind the bass amp, where its cables run'],
    correct: 'The player’s hands, wrists and knees, and their footing',
    explain: 'The player’s space moves all the time. Keep every part of the rig clear of each stroke, wrist and knee, and of where they stand — and stop the player before anything moves.',
    why: {
      'The front of the drums, so the audience can see them clearly': 'How the drums look is not the safety question. The space that moves all the time is the player’s: hands, wrists, knees and footing.',
      'The area behind the bass amp, where its cables run': 'Tidy cables matter, but the space to protect first is the player’s: hands, wrists, knees and footing.',
    },
  },
  micRatingCheck({ id: 'cg.set.2', page: 'setting', mic: 'conga mic', loudest: 'the loudest slap' }),
  {
    id: 'cg.set.3',
    page: 'setting',
    prompt: 'The player stands at two congas resting on the floor. Can you put a mic under each drum’s open end?',
    options: ['No — the ends rest on the floor; work with the setup as it is', 'Yes — tip each drum back a little so a small mic fits under it', 'Yes — slide a thin mic under the rim where the floor is clear'],
    correct: 'No — the ends rest on the floor; work with the setup as it is',
    explain: 'On the floor, nothing goes under the drums. Never change the player’s floor or stand setup, or block the open end, to fit a mic: a bottom mic is an option only when the player already raises the drums.',
    why: {
      'Yes — tip each drum back a little so a small mic fits under it': 'The setup is the player’s. Tipping the drums to fit a mic changes their playing and their sound — work with the drums as they are.',
      'Yes — slide a thin mic under the rim where the floor is clear': 'That blocks the open end and puts a mic where the drum rests. A bottom mic is an option only on drums the player raises.',
    },
  },
  {
    id: 'cg.snd.1',
    page: 'sound',
    prompt: 'Where does the deeper, boomier part of a conga’s sound leave the drum?',
    options: ['Through its open lower end', 'Through the side of the shell', 'Only through the head itself'],
    correct: 'Through its open lower end',
    explain: 'A stroke pushes the head into the drum and the air in the tall shell toward the open lower end; that end carries a deeper, boomier part of the sound — a separate perspective from the head.',
    why: {
      'Through the side of the shell': 'The shell guides the air; the deeper, boomier part leaves through the open lower end.',
      'Only through the head itself': 'The head radiates the hand’s attack and tone, but the open lower end lets out a deeper part as well.',
    },
  },
  {
    id: 'cg.snd.2',
    page: 'sound',
    prompt: 'Open tones are struck near the rim. On the simplified head, what does a strike near the rim do that a centre strike does not?',
    options: ['It drives the shapes with a still line across the head', 'It drives only the lowest shape, like a centre strike', 'It drives nothing, because the rim holds the head still'],
    correct: 'It drives the shapes with a still line across the head',
    explain: 'A strike drives a shape only as much as the head moves at that spot in that shape. At the centre, every shape with a still line across the head stands still; off the centre, those shapes join in.',
    why: {
      'It drives only the lowest shape, like a centre strike': 'A centre strike drives only the ring-shaped shapes. Near the rim, the shapes with still lines across the head move too, and the strike drives them.',
      'It drives nothing, because the rim holds the head still': 'Only the very edge is held still. A little inside it the head moves, so a strike there drives the shapes.',
    },
  },
  {
    id: 'cg.snd.3',
    page: 'sound',
    prompt: 'An open tone and a muted tone are both struck with the fingers near the rim. What separates them?',
    options: ['How the fingers meet the head, and how long they stay', 'The spot on the head where the fingers land', 'Which way the air in the shell leaves through the lower end'],
    correct: 'How the fingers meet the head, and how long they stay',
    explain: 'A muted tone holds the fingers against the head, stopping the ring; an open tone bounces off and lets it ring. The simplified head shows WHERE a strike lands, not how the hand meets it — ask the player to show you each stroke.',
    why: {
      'The spot on the head where the fingers land': 'Both land near the rim. The difference is the contact: held against the head, or bouncing off it.',
      'Which way the air in the shell leaves through the lower end': 'The air goes the same way for both. What differs is the hand: held against the head, or bouncing off it.',
    },
  },
  {
    id: 'cg.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic in front of the lower opening of a raised conga tends to hear more of what?',
    options: ['The deeper, boomier part, with less hand detail', 'The slaps, which leave mostly through the bottom', 'Only the room, because the shell blocks the head'],
    correct: 'The deeper, boomier part, with less hand detail',
    explain: 'The open lower end carries a deeper, boomier part of the sound; the hand’s attack starts at the head. A bottom mic is an extra perspective to blend, not a replacement for the top.',
    why: {
      'The slaps, which leave mostly through the bottom': 'Slaps start where the hand meets the head, on top. The lower end carries the deeper, boomier part.',
      'Only the room, because the shell blocks the head': 'The lower end radiates the drum itself — its deeper part — so a mic there hears the drum, not only the room.',
    },
  },
  {
    id: 'cg.mic.1',
    page: 'microphone',
    prompt: 'Your only spare channel has no phantom power. Which of this page’s mic types can you still use?',
    options: ['The two compact dynamics: neither needs power', 'The clip-on mic, since it is so small and light', 'The slim condenser, if you keep it farther away'],
    correct: 'The two compact dynamics: neither needs power',
    explain: 'Dynamic mics need no power. The clip-on mic and the slim condenser are condensers and need phantom power.',
    why: {
      'The clip-on mic, since it is so small and light': 'Size does not decide power: the clip-on mic is a condenser and needs phantom power through its adapter.',
      'The slim condenser, if you keep it farther away': 'Distance does not change what a condenser needs: it still needs phantom power.',
    },
  },
  {
    id: 'cg.mic.2',
    page: 'microphone',
    prompt: 'One approach uses condensers for conga overdubs and dynamics next to a drum kit. What does that tell you?',
    options: ['A choice for those situations, not a law about mic types', 'Condensers are the natural-sounding choice for congas', 'Dynamics are what isolates congas from the rest of a band'],
    correct: 'A choice for those situations, not a law about mic types',
    explain: 'Pattern, distance, off-axis response, aim and the room decide more than the transducer type. Neither type is automatically natural or isolating — compare them by ear in the situation in front of you.',
    why: {
      'Condensers are the natural-sounding choice for congas': 'No type is automatically natural. A condenser can cover hand detail well in a controlled room — test it by ear.',
      'Dynamics are what isolates congas from the rest of a band': 'Isolation comes from pattern, distance and aim more than the transducer type. A dynamic is one practical close choice.',
    },
  },
  {
    id: 'cg.mic.3',
    page: 'microphone',
    prompt: 'A touring rig uses a tiny clip-on mic on each conga. Before you copy it, what do you check?',
    options: ['That the clip fits this drum and the player agrees to it', 'That it is the same model the touring rig used', 'Nothing more — a setup used on a big tour is proven to work'],
    correct: 'That the clip fits this drum and the player agrees to it',
    explain: 'A touring case shows one workable choice, not a rule. Get the player’s consent before clipping anything to the shell or rim, and check the clamp for fit, rattle and every hand stroke.',
    why: {
      'That it is the same model the touring rig used': 'No brand or model is required. What matters is that the mount suits this drum and the player agrees.',
      'Nothing more — a setup used on a big tour is proven to work': 'It worked for that tour, on those drums. Check the fit, the player’s consent and the clearance here.',
    },
  },
  {
    id: 'cg.mic.4',
    page: 'microphone',
    prompt: 'You choose between a cardioid and a hypercardioid compact dynamic for a loud stage. What difference matters here?',
    options: ['Where each rejects most — so where a monitor can go', 'The hypercardioid makes the congas louder', 'The cardioid has no rejection at its rear'],
    correct: 'Where each rejects most — so where a monitor can go',
    explain: 'A cardioid rejects most directly behind; a hypercardioid is narrower, rejects most toward the rear sides and has a small rear lobe. Place monitors by the actual pattern.',
    why: {
      'The hypercardioid makes the congas louder': 'A pattern decides what a mic rejects, not how loud the drums are.',
      'The cardioid has no rejection at its rear': 'The reverse: a cardioid rejects most directly behind it.',
    },
  },
  {
    id: 'cg.place.1',
    page: 'placement',
    prompt: 'A starting point says “15 to 60 cm from the tumba head”. Your readout says 30 cm from the conga head. Are you in that zone?',
    options: ['No — the number only counts from the head it names', 'Yes — 30 cm falls inside the 15 to 60 cm band', 'Yes, as long as the mic is also aimed at the tumba head'],
    correct: 'No — the number only counts from the head it names',
    explain: 'A distance only means something with its reference head — which is why every readout here names it.',
    why: {
      'Yes — 30 cm falls inside the 15 to 60 cm band': 'Same number, wrong head: the mic is over the conga, not the tumba.',
      'Yes, as long as the mic is also aimed at the tumba head': 'Aim is a separate variable. The distance is measured from the head the starting point names.',
    },
  },
  {
    id: 'cg.place.2',
    page: 'placement',
    prompt: 'In your one shared mic, the conga is buried under the tumba. What do you try first?',
    options: ['Shift the mic toward the conga, then listen again', 'Turn the gain up until the conga can be heard', 'Ask the player to play the tumba more softly'],
    correct: 'Shift the mic toward the conga, then listen again',
    explain: 'Move or aim a shared mic toward the quieter drum while keeping both in its pickup. If one channel still cannot balance them, add a second mic.',
    why: {
      'Turn the gain up until the conga can be heard': 'Gain lifts both drums together; the balance between them stays the same. Move the mic.',
      'Ask the player to play the tumba more softly': 'The part is the player’s. Balance the drums with the mic’s position first.',
    },
  },
  {
    id: 'cg.place.3',
    page: 'placement',
    prompt: 'In a close mic, slaps dominate and the open tones have almost vanished. A likely cause, and a first move?',
    options: ['It favours one spot or stroke: raise it or change its aim', 'The mic is faulty: swap it for another one of the same type', 'The drum is out of tune: retune it before anything else'],
    correct: 'It favours one spot or stroke: raise it or change its aim',
    explain: 'A close mic can favour a small part of the head or one stroke. Raise it, back it off or change its aim, and ask for the whole phrase again before reaching for EQ.',
    why: {
      'The mic is faulty: swap it for another one of the same type': 'The same mic in the same spot will favour the same stroke. Change the position or the aim first.',
      'The drum is out of tune: retune it before anything else': 'Tuning is the player’s choice, and it sounded right in the room. The close mic is favouring one stroke — move it.',
    },
  },
  {
    id: 'cg.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · You move a stand to reach a new zone. What must its base, boom and cable stay clear of?',
    options: ['The player’s hands, wrists, knees and footing', 'The front of the drums, so the audience can see them clearly', 'The bass amp, so the mic hears less of it'],
    correct: 'The player’s hands, wrists, knees and footing',
    explain: 'Stop the player, move the stand, and keep base, boom, clamp and cable clear of every stroke and of where they stand.',
    why: {
      'The front of the drums, so the audience can see them clearly': 'How the drums look is not the safety question. The space that moves is the player’s.',
      'The bass amp, so the mic hears less of it': 'Spill matters, but the base and cable must first stay out of the player’s space.',
    },
  },
  {
    id: 'cg.ctx.1',
    page: 'context',
    prompt: 'Live, what can favour close, directional mics — often one per drum — on congas?',
    options: ['Stage spill, and the level you need before feedback', 'Directional mics make the congas sound louder on stage', 'The room sound is more useful on a stage than in a studio'],
    correct: 'Stage spill, and the level you need before feedback',
    explain: 'On a loud stage, close directional mics give more direct sound against spill and more independent control; a distant or extra open mic can raise feedback risk. In a studio, more distance may balance the strokes.',
    why: {
      'Directional mics make the congas sound louder on stage': 'A pattern decides what a mic rejects, not how loud the drums are.',
      'The room sound is more useful on a stage than in a studio': 'That is the studio column: more distance helps when the room adds something.',
    },
  },
  {
    id: 'cg.ctx.2',
    page: 'context',
    prompt: 'A floor wedge sits below and in front of a mic aimed at the tumba. Can a cardioid aimed at the head put its null on the wedge?',
    options: ['No — its null is straight behind, up in the air', 'Yes — a cardioid rejects what sits below it', 'Yes, if the mic moves closer to the head'],
    correct: 'No — its null is straight behind, up in the air',
    explain: 'A cardioid rejects most directly behind. Aimed down at the head, its back points up. A supercardioid’s or hypercardioid’s off-axis null can face a wedge below with a modest tilt.',
    why: {
      'Yes — a cardioid rejects what sits below it': 'A cardioid rejects most directly behind it — and aimed at the head, behind is up.',
      'Yes, if the mic moves closer to the head': 'Distance does not move a pattern’s null. Its direction depends on the aim.',
    },
  },
  {
    id: 'cg.ctx.studio',
    page: 'context',
    prompt: 'Studio overdub, no wedges, a good-sounding room. What could justify backing a conga mic off toward 60 cm?',
    options: ['A better balance of strokes, with the room worth hearing', 'A farther mic will make the congas sound louder overall', 'Backing off takes the room’s sound out of the conga mic'],
    correct: 'A better balance of strokes, with the room worth hearing',
    explain: 'In a quiet, well-behaved room, backing off can balance open tones, slaps and muted strokes — and the room becomes part of the sound.',
    why: {
      'A farther mic will make the congas sound louder overall': 'Farther means less direct sound, not more. Distance is for balance, not level.',
      'Backing off takes the room’s sound out of the conga mic': 'The reverse: the farther the mic, the more of the room it hears.',
    },
  },
  {
    id: 'cg.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A mic above a head, facing it, tends to hear more of which part of the sound?',
    options: ['The hand’s attack: slaps and open tones', 'The boomy part from the open lower end', 'The shell, which carries most of the sound'],
    correct: 'The hand’s attack: slaps and open tones',
    explain: 'The attack starts where the hand meets the head, so a mic above it and facing it tends to hear more hand detail — a tendency, and drums vary.',
    why: {
      'The boomy part from the open lower end': 'That leaves through the lower end, on the far side of the drum from a mic above the head.',
      'The shell, which carries most of the sound': 'The head and the open end radiate most; above the head it is the hand’s attack you hear more of.',
    },
  },
  {
    id: 'cg.two.1',
    page: 'twoMic',
    prompt: 'You flip the polarity of mic B. What happens to the arrival-time difference?',
    options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so the two arrivals now line up in time again', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Polarity inversion reverses the signal’s sign. It does not remove a delay caused by sound reaching the mics at different times. The notches move; Δt does not.',
    why: {
      'It drops to zero, so the two arrivals now line up in time again': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still where they were.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  },
  {
    id: 'cg.two.2',
    page: 'twoMic',
    prompt: 'The tumba mic hears a conga stroke 1 ms after the conga’s own mic. Summed at equal level, same polarity: the first notch (simplified model)?',
    options: ['500 Hz, then 1.5 kHz, 2.5 kHz …', '1 kHz, then 2 kHz, 3 kHz, 4 kHz …', '250 Hz, then 750 Hz, 1.25 kHz …'],
    correct: '500 Hz, then 1.5 kHz, 2.5 kHz …',
    explain: 'The first cancellation is where the delay is half a period: f = 1 ÷ (2 × 0.001 s) = 500 Hz, then odd multiples. Inverted, the notches sit at 0, 1 kHz, 2 kHz … instead.',
    why: {
      '1 kHz, then 2 kHz, 3 kHz, 4 kHz …': 'That is the INVERTED set (whole multiples of 1 ÷ Δt). Same polarity cancels where the delay is half a period: 500 Hz.',
      '250 Hz, then 750 Hz, 1.25 kHz …': 'That needs a 2 ms delay. With 1 ms the first notch is at 1 ÷ (2 × 0.001 s) = 500 Hz.',
    },
  },
  {
    id: 'cg.two.3',
    page: 'twoMic',
    prompt: 'One mic per conga. Does placing them by 3:1 — each mic at least three times nearer its own drum than the other mic is — help?',
    options: ['Yes — each hears less of the other drum; still check in mono', 'No — 3:1 applies only to two mics on the same drum', 'Yes — spaced 3:1, the pair can no longer comb at all'],
    correct: 'Yes — each hears less of the other drum; still check in mono',
    explain: '3:1 can reduce interacting pickup between mics on different sources — and one mic per conga is exactly that case. Each mic still hears the other drum a little, later, so judge the pair by ear, in mono, on every stroke.',
    why: {
      'No — 3:1 applies only to two mics on the same drum': 'It is the other way round: 3:1 is about mics on DIFFERENT sources — one mic per drum is where it applies.',
      'Yes — spaced 3:1, the pair can no longer comb at all': 'It reduces the other drum in each mic; it does not remove it. Whatever is left still arrives late and can comb — check in mono.',
    },
  },
  {
    id: 'cg.two.4',
    page: 'twoMic',
    prompt: 'With a bottom mic added, flipping its polarity makes the congas sound bigger — and 3 dB louder. What do you conclude?',
    options: ['Not yet: match the levels, then compare both states in mono', 'Inverted is better, so keep it that way for the rest of the show', 'Normal polarity was wrong, because it was quieter'],
    correct: 'Not yet: match the levels, then compare both states in mono',
    explain: `A louder version almost always sounds “better” at first. ${OPPOSITE_SIDES_POLARITY} Compare across every stroke before you decide.`,
    why: {
      'Inverted is better, so keep it that way for the rest of the show': 'A louder version almost always sounds better at first. Compare at matched level before deciding.',
      'Normal polarity was wrong, because it was quieter': 'Quieter is not wrong. Match levels, then judge which state keeps the body and the attack.',
    },
  },
  {
    id: 'k.prac.gain',
    page: 'practice',
    prompt: 'Typical strokes sit well below the overload light, but the player’s hardest slaps light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader well down until the loudest slaps sound clean', 'Ask the player to slap a little softer during the show'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set input gain with headroom for the strongest intended strokes and check the softer ones too. A lowered fader does not undo clipping at the input; use a pad only as the manual permits.',
    why: {
      'Pull the channel fader well down until the loudest slaps sound clean': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the player to slap a little softer during the show': 'Set gain for the strongest strokes the player intends to play — not for a gentler soundcheck.',
    },
  },
  {
    id: 'k.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second channel to a shared conga mic?',
    options: ['One mic cannot balance the drums, and the pair holds up in mono', 'Two channels give the mix engineer more options to work with later', 'The congas need more level than one mic can give them'],
    correct: 'One mic cannot balance the drums, and the pair holds up in mono',
    explain: 'Add a mic for a real balance or control problem, then check it alone, in the blend and in mono. In live sound, use the fewest open mics that give the control you need.',
    why: {
      'Two channels give the mix engineer more options to work with later': 'More channels also add spill and interactions. A second mic should earn its place.',
      'The congas need more level than one mic can give them': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'k.mix.1',
    page: 'practice',
    prompt: 'A starting point says “15 to 60 cm”. Before you place the mic, what else do you need to know?',
    options: ['Which head it is measured from, and how to aim it', 'The brand of the drum, so the number matches its size', 'Nothing more: the number tells you where the mic goes'],
    correct: 'Which head it is measured from, and how to aim it',
    explain: 'A distance belongs to its named head, and a starting point may also name an aim. Clearance is a separate check again.',
    why: {
      'The brand of the drum, so the number matches its size': 'A starting point’s distance belongs to its named head; the drum’s brand does not change that.',
      'Nothing more: the number tells you where the mic goes': 'A distance means nothing without its reference head; aim and clearance are separate checks.',
    },
  },
  {
    id: 'k.mix.2',
    page: 'practice',
    prompt: 'Your floor wedge sits about 110° off a hypercardioid’s front axis. What can you expect?',
    options: ['Strong rejection on paper; less in reality, least in the lows', 'Silence from the wedge, because it sits in the null', 'More pickup than from straight behind, where it rejects the most'],
    correct: 'Strong rejection on paper; less in reality, least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — use the null to aim, not to promise silence.',
    why: {
      'Silence from the wedge, because it sits in the null': 'A null is infinitely deep only on paper. Real mics reject far less, and least in the lows.',
      'More pickup than from straight behind, where it rejects the most': 'Straight behind, a hypercardioid has a rear lobe; its deepest rejection is off the rear axis.',
    },
  },
  {
    id: 'k.mix.3',
    page: 'practice',
    prompt: 'Two conga mics sound thin together. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning the later mic up until it matches the earlier one'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the later mic up until it matches the earlier one': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  },
];

/* The lesson's troubleshooting table (L33-L38), as tap-through cards. */
const symptoms: Symptom[] = [
  {
    id: 's.slap',
    observation: 'Slaps dominate; the open tones disappear',
    firstChecks: 'Does the close mic favour a small part of the head or only one stroke?',
    options: ['Whether a close mic favours one spot or stroke — raise it or re-aim', 'Cut the high frequencies with EQ until the slaps sit back in the mix', 'Ask the player to leave the slaps out of the part'],
    correct: 'Whether a close mic favours one spot or stroke — raise it or re-aim',
    explain: 'Raise it, back it off or change its aim, and ask for the whole musical phrase again.',
    why: {
      'Cut the high frequencies with EQ until the slaps sit back in the mix': 'Move the mic before reaching for EQ: a cut also dulls the open tones you lost.',
      'Ask the player to leave the slaps out of the part': 'The part is the player’s. The mic should represent all of it.',
    },
  },
  {
    id: 's.low',
    observation: 'The low note overwhelms the articulation',
    firstChecks: 'Is the mic aimed toward the low head region or the lower opening; is proximity adding weight?',
    options: ['Its aim and closeness, and any bottom mic — reposition first', 'Boost the high frequencies with EQ until the hand detail returns', 'Turn the whole channel down until the low end settles'],
    correct: 'Its aim and closeness, and any bottom mic — reposition first',
    explain: 'Reposition the main mic; reduce or remove the optional bottom mic before processing.',
    why: {
      'Boost the high frequencies with EQ until the hand detail returns': 'EQ after the fact cannot replace a better position. Check the aim, the distance and any bottom mic first.',
      'Turn the whole channel down until the low end settles': 'Level lowers everything together; the balance stays wrong. Move the mic.',
    },
  },
  {
    id: 's.buried',
    observation: 'One conga is consistently buried',
    firstChecks: 'Player dynamics, shared-mic aim, stand heights, mic pattern.',
    options: ['The player’s dynamics, the shared mic’s aim, heights and pattern', 'Swap the two drums over so the quiet one sits nearer the shared mic', 'Turn the gain up until the quiet drum comes through'],
    correct: 'The player’s dynamics, the shared mic’s aim, heights and pattern',
    explain: 'Shift the shared mic, or use separate channels when one mic cannot balance them.',
    why: {
      'Swap the two drums over so the quiet one sits nearer the shared mic': 'The setup is the player’s. Move the mic, not the drums.',
      'Turn the gain up until the quiet drum comes through': 'Gain lifts both drums together; the balance between them stays the same.',
    },
  },
  {
    id: 's.thin',
    observation: 'A hollow or thin combined sound',
    firstChecks: 'Shared pickup at different arrival times: solo, mono sum, mic movement, polarity.',
    options: ['Solo each, sum in mono, move a mic, then compare polarity', 'Invert the second mic, since a second mic is usually inverted', 'Turn both channels up together until the sound fills out'],
    correct: 'Solo each, sum in mono, move a mic, then compare polarity',
    explain: 'Judge the full performance; polarity is one comparison, not a cure.',
    why: {
      'Invert the second mic, since a second mic is usually inverted': 'No mic is “usually inverted”. Compare BOTH states at matched level, in mono, after moving the mics.',
      'Turn both channels up together until the sound fills out': 'More level does not fix a cancellation; it makes the thin sound louder.',
    },
  },
  {
    id: 's.feedback',
    observation: 'Poor live level before feedback',
    firstChecks: 'Monitor position, number of open channels, mic distance and pattern, PA and room.',
    options: ['Monitor position, open channels, mic distance and pattern', 'Turn the monitor up so the player hears more of the congas', 'Add another mic farther away to catch more of the drums'],
    correct: 'Monitor position, open channels, mic distance and pattern',
    explain: 'Re-aim or move the monitor and mic with the system operator; close an unneeded channel. Never create feedback to test it.',
    why: {
      'Turn the monitor up so the player hears more of the congas': 'More monitor level means less margin before feedback.',
      'Add another mic farther away to catch more of the drums': 'Another open, distant mic raises feedback risk. Use the fewest open mics that work.',
    },
  },
  {
    id: 's.contact',
    observation: 'A mic or cable is struck',
    firstChecks: 'The full hand path and the player’s movement: stop, mute, move or secure the rig, and repeat the clearance check.',
    options: ['Stop, mute, move or secure it; then check clearance again', 'Keep going carefully and fix the mount once the song is over', 'Tape the cable to the shell so that it cannot move'],
    correct: 'Stop, mute, move or secure it; then check clearance again',
    explain: 'Clearance comes first: have the player stop before any mic moves, and check again at full intensity.',
    why: {
      'Keep going carefully and fix the mount once the song is over': 'Clearance comes first: stop before any mic moves.',
      'Tape the cable to the shell so that it cannot move': 'Taping to the drum puts the cable in the hand path and changes the drum. Route it away from the player.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'k.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic setup in the order you would do them.',
    steps: [
      { text: 'Ask the player: which drum is which, which strokes, standing or seated, floor or stands?', early: 'Start with the player and the drums.' },
      { text: 'Choose a mic whose pattern, power, size and mount suit the drums and the show', early: 'Choose the mic once you know the drums and the part.' },
      { text: 'Have the player stop; mount the mic; check clearance from hands, wrists and knees', early: 'You need a chosen mic before you can mount it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is mounted and its cable connected — with the outputs muted first.' },
      { text: 'Set input gain on typical AND strongest strokes, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare positions one change at a time, at matched levels', early: 'Compare only once the level is set safely — and at matched levels, so louder does not win.' },
      { text: 'Keep the simplest position that works, with safe clearance', early: 'Decide last, after comparing.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it with headroom for the strongest strokes, then check the softest.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'This input gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point for this kind of mic, from the right head', role: 'required', feedback: 'Say why it is a good place to begin, and which head it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, mount and cable stay clear of the hands, wrists, knees and the open ends', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on congas', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const BASS_REASON: SetupReason = { id: 'r.bass', label: 'It will give the most bass of any position on the drums', role: 'wrong', feedback: 'Bass emphasis is not a passing reason, and no position always gives the most bass.' };

const setupTasks: SetupTask[] = [
  {
    id: 'k.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Two congas on the floor, a quiet studio, overdubbed alone. The player wants open tones, slaps and bass all heard. One or two channels; phantom power is available.',
    setups: [
      { id: 'a', label: 'One compact dynamic between the heads, just above them, aimed down', ok: true, power: 'none', feedback: 'A recommended starting point for a pair: a full sound with good attack, on one channel.' },
      { id: 'b', label: 'A slim condenser over each drum, starting about 15–60 cm from its head', ok: true, power: 'phantom', feedback: 'A recommended starting point; in a quiet room, distance can balance the strokes, and phantom is available.' },
      { id: 'c', label: 'A clip-on condenser at each drum’s far rim, with the player’s OK', ok: true, power: 'phantom', feedback: 'Independent control in little space; it needs the phantom power this input has.' },
      { id: 'd', label: 'A mic slid under each drum’s open end, to catch the bass', ok: false, power: 'none', feedback: 'On the floor the open ends rest on it: nothing goes under, and the open end is never blocked.' },
      { id: 'e', label: 'A mic over the player’s side of the heads, where the hands land', ok: false, power: 'none', feedback: 'That is inside the hand path: the mic or stand would be struck.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'In a quiet room, a little distance can balance the strokes', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named head, clearance, and power that matches the mic.',
  },
  {
    id: 'k.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage with a floor wedge in front of the drums, which stand on the floor. The spare inputs have NO phantom power.',
    setups: [
      { id: 'a', label: 'A compact dynamic over each drum, outside the hands, aimed at its head', ok: true, power: 'none', feedback: 'Close and directional, one per drum for control on a loud stage; a dynamic needs no phantom.' },
      { id: 'b', label: 'One compact dynamic between the heads, just above them, aimed down', ok: true, power: 'none', feedback: 'A recommended starting point for a pair; a dynamic needs no phantom.' },
      { id: 'c', label: 'A clip-on condenser at each drum’s far rim', ok: false, power: 'phantom', feedback: 'A fair stage idea, but these inputs have no phantom power and the clip-on mic needs it.' },
      { id: 'd', label: 'A slim condenser a metre above both drums', ok: false, power: 'phantom', feedback: 'Too distant for a loud stage — and it needs phantom power these inputs lack.' },
      { id: 'e', label: 'A dynamic under each drum’s open end', ok: false, power: 'none', feedback: 'On the floor the open ends rest on it: nothing goes under them.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against spill and feedback on stage', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'Two close, dynamic setups pass. What passes is the reasoning: a sensible starting point, clear of the player, powered by what these inputs can supply.',
  },
];

const predictions: HandLesson['predictions'] = {
  sound: { prompt: 'Before you step through: when the hand pushes the head down into the drum, where does the air inside go?', options: ['Down the shell, toward the open lower end', 'Up, back out through the head', 'Nowhere — the air inside the shell stays still'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the air.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you raise the shared mic from just above the heads to higher up. What changes?', options: ['More of both drums blended, and more room', 'More slap from the nearer drum', 'Nothing until it is a metre away'], after: 'Higher and farther tends to blend the pair and bring in more of the room — a tendency to check by ear, with every stroke.' },
  context: { prompt: 'Where can this mic, aimed at the tumba, best reject the floor wedge in front of the drums?', options: ['Straight behind the mic', 'Toward its rear, off to one side', 'At the sides of the mic'], after: 'Now tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

/* THE QUICK CHECK: 6 items, two per foundation page; q.6 (hearing) critical. */
const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What is a conga’s open lower end?',
    options: ['The bottom of the shell, open to the air', 'A port cut in the head for a microphone', 'A hole in the shell’s side used for tuning'],
    correct: 'The bottom of the shell, open to the air',
    explain: 'A conga is single-headed: the shell is open at the bottom, which lets out a deeper, boomier part of the sound.',
    why: {
      'A port cut in the head for a microphone': 'The head is struck by the hands and has no port. The open end is the shell’s bottom.',
      'A hole in the shell’s side used for tuning': 'Tuning is done at the rim. The open end is the bottom of the shell.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'In a pair of congas, which is usually the larger, lower drum?',
    options: ['The tumba', 'The quinto', 'The macho'],
    correct: 'The tumba',
    explain: 'Commonly the largest drum is the tumba, the middle the conga, the smallest the quinto — names vary with tradition, so ask the player which drum is which.',
    why: {
      'The quinto': 'The quinto is usually the smallest, highest drum.',
      'The macho': 'Macho is a bongo word: the smaller of a bongo pair.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Open tones land near the rim. Compared with a strike at the centre, what does a strike there set moving?',
    options: ['Shapes with a still line across the head, too', 'Only the lowest, ring-shaped shape of the head', 'Nothing — the rim holds the head still'],
    correct: 'Shapes with a still line across the head, too',
    explain: 'At the centre, every shape with a still line across the head stands still; away from the centre, those shapes move, so a strike there drives them too.',
    why: {
      'Only the lowest, ring-shaped shape of the head': 'That is closer to a centre strike. Away from the centre, more shapes are driven.',
      'Nothing — the rim holds the head still': 'Only the very edge is held. A little inside it the head moves, and a strike there drives its shapes.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A stroke pushes the head down into the drum. Where is the air inside pushed?',
    options: ['Down the shell, toward the open lower end', 'Up and back out through the head itself', 'Nowhere — the air inside the shell stays still'],
    correct: 'Down the shell, toward the open lower end',
    explain: 'The head moving down pushes the air in the shell toward the open lower end, where a deeper part of the sound leaves.',
    why: {
      'Up and back out through the head itself': 'The head is moving down, into the drum — it pushes the air down, toward the open end.',
      'Nowhere — the air inside the shell stays still': 'The moving head pushes the air in front of it, down the shell toward the open end.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Where should the cable for a conga mic run?',
    options: ['Away from the player’s feet and their path', 'Up the shell, taped firmly to the drum', 'Into the open lower end, out of everyone’s sight'],
    correct: 'Away from the player’s feet and their path',
    explain: 'Secure cables so they do not shift into the player or create a trip hazard — and never into the open end.',
    why: {
      'Up the shell, taped firmly to the drum': 'That puts the cable in the hand path and changes the drum. Route it away from the player.',
      'Into the open lower end, out of everyone’s sight': 'Never route a cable into the open end: it blocks the sound and the drum’s support.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your mic is rated to a very high maximum SPL. What does that tell you about standing by the congas through a long soundcheck?',
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe for a while, as long as the drums stay below the mic’s rating', 'It is safe as long as the mic is nearer the drums than you'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe for a while, as long as the drums stay below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is nearer the drums than you': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  },
];

const IN = 25.4;

export const M04A_LESSON: HandLesson = {
  id: 'M04a',
  labId: 'drums',
  title: 'Congas',
  subtitle: 'A pair of hand drums: one mic or one each, top or bottom',
  noun: { one: 'conga', many: 'congas' },
  copy: handCopy(CONGA_WORDS),
  model: CONGA_MODEL,
  micTypeIds: ['hdDynCard', 'hdDynHyper', 'hdSdc', 'hdClip'],
  zones: CONGA_ZONES,
  setupPairs: [{ label: 'One mic over each drum', A: { zone: 'cg.tumba', typeId: 'hdDynCard' }, B: { zone: 'cg.conga', typeId: 'hdDynCard' } }],
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Congas are tall, single-headed hand drums, open at the bottom, played with the hands. Players use a pair or several sizes — commonly a quinto (smallest), a conga and a tumba (largest), though the names vary with tradition and setup.', src: 'RM-CONGA' },
    { title: 'WHERE YOU MEET THEM', text: 'In Latin, Afro-Cuban and popular music, on stage and in the studio. They may be played seated, or standing with the drums mounted on stands. This lesson covers studio recording and live sound.', src: 'WP-CONGA' },
    { title: 'WHAT THEY DO IN THE MUSIC', text: 'A whole part in strokes: open tones, slaps, bass and muted strokes, across two or more drums. Which drum carries what — and which strokes matter most — decides a lot about the mics, so ask before you start.', src: 'LESSON' },
    { title: 'THEIR SIZE', text: `Common heads run from about 11 to 12½ in across, on drums about 30 in tall. This lab draws an 11¾ in conga and a 12½ in tumba, side by side.`, src: 'LP-CLASSIC' },
  ],
  sound: {
    stages: [
      { title: 'The hand strikes', text: 'The player’s hand strikes the head — the fingers near the rim for an open tone, the palm a little off centre for a bass stroke. That brief contact is where the ATTACK begins.' },
      { title: 'The head is pushed in', text: 'The head bows down into the drum — most at the centre, not at all at the rim: its lowest vibration shape, drawn here many times larger than it really moves. Then it springs back and rings.' },
      { title: 'The air is pushed down', text: 'The head pushes the air in the tall shell down toward the open lower end. Here the drum stands on the floor, so that end meets the floor.', ported: 'The head pushes the air in the tall shell down and out of the open lower end — raised on a stand, that end is clear of the floor. As the head moves down, the air above it thins while air is pushed out below: a mic above and a mic at the open end hear opposite pushes.' },
      { title: 'Sound leaves the drum', text: 'Sound leaves from the head — up and around, toward the player and any mic above — and around the base, where the open end meets the floor. Head and lower end are different perspectives.', ported: 'Sound leaves from the head — up and around — and from the open lower end, which adds a deeper, boomier part. Head and lower end are different perspectives.' },
    ],
    attack: 'The start of the sound: the hand’s brief contact with the head. It begins at the head, so a mic above the head and facing it tends to hear more of the hand’s detail — slaps and open tones.',
    body: 'The ringing that follows: the head and the air in the shell. Part of it leaves through the open lower end, a deeper, boomier view with less hand detail. Both are tendencies, and drums vary. Tuning and the player’s hand change how long a drum rings.',
    head: { diameterMm: 12.5 * IN, rods: D.lugs.mm, label: '12½ in tumba head, seen from above', strikeSrc: 'WP-CONGA' },
  },
  setting: {
    items: [
      { id: 'drums', label: 'the congas (the same drawing as every other page)', short: 'CONGAS', note: 'The conga on the player’s left, the tumba on the right, both standing on the floor here — or raised on stands.', prov: { kind: 'sourced', src: 'LP-CLASSIC', quote: '11-3/4″ Conga, 12-1/2″ Tumba, 30″ tall' }, tag: 'THE DRUMS', scene: 'all' },
      { id: 'player', label: 'the player, standing behind the drums', short: 'PLAYER', note: 'Their hands work over the player’s side of both heads; their wrists, knees and footing move all the time. Nothing of yours goes through that space.', prov: { kind: 'illustrative', reason: 'a standing player; no source gives the reach' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'kit', label: 'the drum kit', short: 'DRUM KIT', note: 'A loud neighbour. Its spill reaches an open conga mic — closer, directional mics help, and a distant mic hears more of it.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'SPILL', scene: 'all' },
      { id: 'bass', label: 'the bass amp', short: 'BASS AMP', note: 'Low-frequency spill into a conga mic — especially a bottom mic or a distant one.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'SPILL', scene: 'all' },
      { id: 'perc', label: 'other percussion (bongos, a bell)', short: 'PERCUSSION', note: 'The part may move between instruments: a fixed mic covers only the congas, and the player’s path between them stays clear.', prov: { kind: 'illustrative', reason: 'a typical percussion setup; no source gives positions' }, tag: 'MOVEMENT', scene: 'all' },
      { id: 'vox', label: 'a vocal mic', short: 'VOCAL MIC', note: 'Another open mic on stage that also hears the congas — part of the blend, and of the feedback picture.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'OPEN MIC', scene: 'all' },
      { id: 'wedge', label: 'the player’s floor wedge', short: 'WEDGE', note: 'On the floor in front of the drums, facing the player — below and in front of a mic aimed at the heads. You will see later which patterns can turn a null toward it.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'sidefill', label: 'a side fill', short: 'SIDE FILL', note: 'A loud monitor at the side of the stage, across from the drums — off to the side of a mic aimed at a head.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the PA adds to what the audience hears from the drums themselves — check the real coverage, not a promised level.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a studio there are no wedges, and a good room can help: backing a mic off balances the strokes — with more of the room in the sound.', prov: { kind: 'illustrative', reason: 'a generic room; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a floor wedge in front of the player, loud neighbours — the kit, the bass amp — and the PA facing the audience. Spill and the gain available before feedback push toward close, directional pickup, often one mic per drum.',
    studio: 'STUDIO: no wedges on the floor, repeated trials are practical when the player stops, and in a good room more distance can balance the strokes — with more of the room in the sound.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for given drums and a given performance, describe an alternative, and explain what would justify a second channel. With real drums and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'drum', label: 'Drums (sizes, which is which, heads)', kind: 'text' },
      { id: 'setup', label: 'Setup', kind: 'choice', choices: ['on the floor', 'raised on stands', 'seated'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['compact dynamic', 'small condenser', 'clip-on condenser', 'other'] },
      { id: 'pattern', label: 'Pattern', kind: 'text' },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from which head', kind: 'text' },
      { id: 'aim', label: 'Aim', kind: 'text' },
      { id: 'notes', label: 'What you heard, stroke by stroke (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The plan spacing of the two drums, the shell taper and the bottom opening’s size — drawing defaults.', dims: ['spacing', 'bottomRatio'] },
    { text: 'The rim: its height above the head and how far it stands out; the number of tuning lugs — drawing defaults, never stated.', dims: ['rimRise', 'rimT', 'lugs'] },
    { text: 'How far a raised setup lifts the drums, and the stands themselves — drawing defaults.', dims: ['raise'] },
    { text: 'The player’s hands and body envelopes — ILLUSTRATIVE, for the owner to approve.', dims: ['handsUp'] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'wedge', label: 'the player’s floor wedge, in front of the drums, facing them', short: 'WEDGE', p: { x: 1050, y: 0, z: 0 }, lift: 150, faces: { x: -1, y: 0, z: 0 }, note: 'Below and in front of a mic aimed at the heads — where an off-axis null can help.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
      { id: 'sidefill', label: 'a side fill at the side of the stage, facing across', short: 'SIDE FILL', p: { x: -250, y: 0, z: -1900 }, lift: 1100, faces: { x: 0, y: 0, z: 1 }, note: 'Off to the side of the mic: turning one null toward the wedge leaves the side fill where the pattern still hears it. One null cannot face every monitor — distance, level and fewer open mics matter too.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every drum, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a pair of congas, mic patterns and the two-mic comb as textbook shapes, and head motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  hand: {
    drum: TUMBA,
    shellLook: 'staved',
    headLook: 'rawhide',
    tool: 'hand',
    variantKey: 'SETUP',
    figure: { view: 'side', badge: 'A pair of congas — 11¾ and 12½ in, 30 in tall — seen from the player’s right', label: 'Side view of a pair of congas standing on the floor: the tumba in front, the conga directly behind it, each a tall staved wooden shell with a rawhide head held by a chrome rim, open at the bottom.' },
    partsBadge: 'A pair of congas · tap a part to name it',
    partsPrompt: 'Tap any part — or step through PART — to see what it is and what it does. Switch SETUP to raise the drums on stands. There is nothing to answer on this page.',
    partsNote: 'The hands strike the heads; the open lower ends let out a deeper part of the sound. The next page shows how.',
    soundBadge: 'The order of events, not their speed · head motion drawn much larger than it really is · silent',
    faceLabel: 'the tumba head',
    strikeWord: 'HAND',
    face: { kind: 'crown', lugs: D.lugs.mm },
    facePoints: [
      { id: 'c', label: 'CENTRE', frac: 0, blurb: 'The exact centre of the head.' },
      { id: 'h', label: 'HALFWAY', frac: 0.5, blurb: 'Halfway from the centre to the rim.' },
      { id: 'e', label: 'NEAR THE RIM', frac: 0.85, blurb: 'Close to the rim — where open tones are played.' },
    ],
    openEnd: { default: false, raised: true },
    strokes: {
      title: 'Where the hand lands',
      intro: 'Switch STROKE and watch which of the head’s shapes the spot drives. The bars are physics; the stroke names are the player’s.',
      badge: 'A simplified head · where the hand lands, drawn at a typical spot · bars = how strongly that spot drives each shape',
      items: [
        { id: 'open', label: 'OPEN TONE', short: 'OPEN', frac: 0.85, tool: 'fingers', text: 'Four fingers near the rim, bouncing off: a clear, ringing tone.' },
        { id: 'muted', label: 'MUTED TONE', short: 'MUTED', frac: 0.85, tool: 'fingers', text: 'Four fingers struck and held against the head: the tone is stopped short.' },
        { id: 'bass', label: 'BASS STROKE', short: 'BASS', frac: 0.3, tool: 'palm', text: 'The full palm, slightly cupped, a little off centre: a low, round sound.' },
      ],
      note: 'This simplified head shows WHERE the hand lands, not how it meets the head — its area and how long it stays — which is what separates an open tone from a muted one, or from a slap. Ask the player to show you every stroke.',
    },
    soundReveal: 'The head moving down pushes the air in the tall shell toward the open lower end — that is where the drum’s deeper part leaves.',
    plan: {
      box: { u0: -2000, u1: 2300, v0: -1400, v1: 1300 },
      things: [
        { id: 'drums', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'player', kind: 'player', u: -470, v: 0, scene: 'all' },
        { id: 'kit', kind: 'kit', u: -1350, v: -700, scene: 'all' },
        { id: 'bass', kind: 'amp', u: -1450, v: 900, face: 0, scene: 'all' },
        { id: 'perc', kind: 'perc', u: -420, v: 820, scene: 'all' },
        { id: 'vox', kind: 'micstand', u: 620, v: -600, scene: 'all' },
        { id: 'wedge', kind: 'wedge', u: 1050, v: 0, face: Math.PI, scene: 'stage' },
        { id: 'sidefill', kind: 'sidefill', u: -250, v: -1150, face: Math.PI / 2, scene: 'stage' },
        { id: 'audience', kind: 'audience', u: 1750, v: 0, scene: 'stage' },
        { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
      ],
      badge: 'The band from above · a typical layout · the player at the left, the audience to the right',
      looking: 'Plan · the band from above · the player behind the congas',
      prompt: 'Tap anything around the congas — or step through ITEM — to see what it means for a conga mic. There is nothing to answer yet.',
      intro: 'The congas stand in front of the player, with louder neighbours around them. Everything near them is either the player’s space or a source of spill.',
      label: 'The band from above: the congas in the middle with the player behind them, a drum kit and a bass amp behind the player, other percussion to the player’s right and a vocal mic in front.',
    },
    before: {
      ask: 'Which drum is which, what does each one play — open tones, slaps, bass, muted strokes — and will they stand at drums on stands or play seated? Ask for the whole part at performance level, and hear it in the room first. Check the heads, tuning, hardware and stands for rattles with the player before changing any mic.',
      asIs: 'The drums and their setup are the player’s. Don’t change how they stand or sit, tilt or raise a drum, or block the open lower end to fit a diagram.',
    },
    worked: { default: 'cg.shared' },
    clearWords: 'Clear of every hand stroke, wrist and knee, of the rims and of the open lower ends. Clearance comes first, before any number — and the player stops before a real mic moves.',
    ideas: {
      hdDynCard: 'Ideas to try with this kind of mic: one mic between the two heads first. If one channel cannot balance them, a mic over each drum. Shift a little toward the quieter drum, or raise it for a blend.',
      hdDynHyper: 'Ideas to try with this kind of mic: close over each drum, outside the hands, aimed across the head rather than straight into one strike point. Its narrow pattern helps against spill — and it can favour one stroke if it is too close.',
      hdSdc: 'Ideas to try with this kind of mic: in a quiet room, over each drum, starting closer and backing off until open tones, slaps and muted strokes balance — then listen to how much room comes with it.',
      hdClip: 'Ideas to try with this kind of mic: on each drum’s far rim, the capsule just above the head and aimed across it — little stage space, independent control. Check the clamp for rattles, and keep it out of every hand stroke.',
    },
    placeLearn: [
      'What you just did, in words. After our research, each blue zone is where we recommend you begin with that kind of mic, measured from the head it names. They are starting points, not rules: move from there and listen — there is no single right answer, and every drum and player is different.',
      'Height, distance and angle are separate variables: change one at a time and have the player play every stroke again. A starting point that names an aim counts only while the mic faces that way. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
      'Clearance comes first. Stop the player before moving a mic; keep the capsule, stand, boom, clamp and cable clear of every hand stroke, wrist and knee — and of the open lower ends. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where to keep clear; leave more room on a real stage, and check again during the loudest, most animated passage.',
      'Closer and more direct tends to bring more hand detail and isolation — and can favour one stroke or make slaps very pronounced. Backing off in a good room tends to balance the strokes, with more of the room and the band. A separate room mic, about two metres in front, is another idea for a good studio. Move the mic before reaching for EQ.',
    ],
    context: {
      pose: { p: { x: TUMBA.c.x + TUMBA.R + 60, y: HEAD_Y - 160, z: TUMBA.c.z }, az: 0, el: -35 },
      looking: 'Side view · a mic at the tumba’s far edge, aimed back across the head',
      prompt: 'The wedge stays where the player needs it. Tilt the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still faces the drum.',
      learn: [
        { title: 'HOW MUCH ROOM', text: 'Studio: one shared mic, or one per drum at a moderate distance; distance can blend the strokes, and the room becomes part of the sound. Live: close, stable directional mics, often one per drum, for direct sound against spill.' },
        { title: 'HOW MANY MICS', text: 'Studio: add a bottom or room perspective only for a clear purpose. Live: use the fewest open mics that give the control you need — a distant or extra open mic raises feedback risk.' },
        { title: 'WHAT THE PART NEEDS', text: 'A quiet acoustic stage may only need a shared overhead-style position. A loud stage with wedges usually needs closer, independent control. Check the real audience coverage with the system operator.' },
        { title: 'MOUNTING', text: 'Studio: repeated trials are practical when the player stops. Live: stable stands or approved clips, cables secured away from feet, checked during the loudest passage.' },
      ],
      closing: 'No mic position alone prevents feedback: the monitors and PA, channel gain, the room and the open mics all matter. A supercardioid’s rear lobe is not a cardioid’s rear null — place monitors by the actual pattern. Never create feedback deliberately.',
    },
    pairs: [
      {
        id: 'perdrum',
        label: 'One mic over each drum',
        blurb: 'Each mic hears its own drum — and the other one, a little later. A conga stroke reaches mic B, over the conga, first; mic A, over the tumba, hears it later.',
        A: { typeId: 'hdDynCard', pattern: 'cardioid', pose: CONGA_ZONES.find((z) => z.id === 'cg.tumba')!.start },
        B: { typeId: 'hdDynCard', pattern: 'cardioid', pose: CONGA_ZONES.find((z) => z.id === 'cg.conga')!.start },
        source: 'r.conga',
      },
      {
        id: 'topbottom',
        label: 'Top and bottom (raised)',
        blurb: 'A mic over the tumba and one in front of its lower opening hear different parts of the same drum, at different times — the drums are raised for this pair.',
        variant: 'raised',
        A: { typeId: 'hdDynCard', pattern: 'cardioid', pose: CONGA_ZONES.find((z) => z.id === 'cg.tumba')!.start },
        B: { typeId: 'hdDynCard', pattern: 'cardioid', pose: CONGA_ZONES.find((z) => z.id === 'cg.bottom')!.start },
        source: 'r.heads',
      },
    ],
    pairLearn: [
      'Two mics on the same drums capture overlapping sound at different times. Bring up one mic as a reference, then add the second at a useful level, and listen to the blend in mono across every stroke.',
      'If the lows or the attack thin out, move or re-aim a mic first, then compare its polarity switch — a diagnostic step, not a cure. Keep whichever arrangement best represents the whole part; live, use the fewest open mics that give the control you need.',
      'What you just saw: sound reaches two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity inversion flips the sign — it moves the notches; it does not remove the delay. No fixed spacing ratio makes a pair on one set of drums coherent.',
    ],
    pairWarn: 'The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the two levels, which this model takes from distance alone (1/r) — that does not hold this close to a drumhead, so read the depths as illustrative only. Judge the pair by ear, in mono, at matched levels.',
  },
};

/** The drums, for the art (kept beside the lesson). */
export const CONGA_DRUMS = { CONGA, TUMBA } as const;
