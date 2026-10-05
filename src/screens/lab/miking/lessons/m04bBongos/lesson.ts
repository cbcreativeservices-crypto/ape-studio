/**
 * M04b BONGOS — the lesson's pages as DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Bongos-Miking-Technique-Research.txt, "L<n>"
 * in COMMENTS only) with the fixes logged in CORRECTIONS_LOG.md (BG-…).
 * The lesson and its sources give NO numeric positions: the starting points
 * are regions to begin in (the geometry file's drawing defaults), said in the
 * starting-points voice (owner ruling 2026-10-04).
 * The practice page is the shared PPractice: its ids (k.prac.*, k.mix.*) are
 * that page's contract.
 */
import type { DiagnosticItem, MikingScenario, OrderTask, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { micRatingCheck } from '../../engine/model/sharedItems.ts';
import { handCopy, type HandLesson } from '../shared/handdrums/family.ts';
import { BONGO_MODEL, BONGO_WORDS } from './geometry.ts';
import { BETWEEN, BONGO_DIMS as D, BONGO_ZONES, HEAD_Y, HEMBRA, MACHO } from './model.ts';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the bongos',
    goal: 'Get to know a pair of bongos — what they are, where you meet them, what they do in the music, and their parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Two small, open-bottomed drums joined by a centre block: the smaller macho, the larger hembra. Work with the pair as the player holds or mounts it.',
  },
  sound: {
    title: 'How they make their sound',
    goal: 'See how a finger stroke becomes sound, where it leaves the drum, and why the two heads differ. Shown, never played.',
    credit: { scenarios: ['bg.snd.1', 'bg.snd.2', 'bg.snd.3'], interactive: 'soundPath', note: 'Step the stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The fingers’ attack starts at the heads; part of the sound leaves through the open ends. On heads at the same tension the smaller macho’s shapes sit higher — players tune the pair apart on purpose.',
  },
  setting: {
    title: 'Where they sit',
    goal: 'Know where the bongos sit in a band, the player’s space — hands, legs, a stand — and what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['bg.set.1', 'bg.set.2', 'bg.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The hands play from any side of the heads, and a seated player’s legs move beside the drums: no stand, boom or cable goes there. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the pair by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['bg.mic.1', 'bg.mic.2', 'bg.mic.3', 'bg.mic.4', 'bg.rec.1'], note: 'Answer the five checks (one reaches back to how the bongos sound).' },
    takeaway: 'Pattern, power, size and mount decide what a mic can do here. A condenser is not automatically natural, a dynamic not automatically isolating, and a mic’s maximum SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — one mic between the heads, or a spot or clip-on per drum — clear of every finger stroke; then move the mic and see what changes.',
    credit: { scenarios: ['bg.place.1', 'bg.place.2', 'bg.place.3', 'bg.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'No source gives a bongo distance: “just above” means safely clear of the hands, then listen. Move toward the weaker drum, back off to blend — one change at a time.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s real rejection faces the floor wedge — and know what a pattern cannot do.',
    credit: { scenarios: ['bg.ctx.1', 'bg.ctx.2', 'bg.ctx.studio', 'bg.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: tilt the mic (or change its pattern) until the floor wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Place monitors by the actual pattern: a cardioid rejects most behind, a hypercardioid off the rear axis, a figure-8 at its sides — and a figure-8’s back lobe is fully live. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Compare two spots with a coincident pair: see how the arrival-time difference places comb-filter notches, and what polarity does and does not change.',
    credit: { scenarios: ['bg.two.1', 'bg.two.2', 'bg.two.3', 'bg.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two spots each hear both drums at different times; a coincident pair keeps its arrival difference small. Polarity flips the sign; it does not remove a delay. Judge the pair in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the player’s dynamics and the mic’s position, aim, clearance and gain before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second channel.',
    credit: { scenarios: ['k.prac.order', 'k.prac.gain', 'k.prac.setup1', 'k.prac.setup2', 'k.prac.3', 'k.mix.1', 'k.mix.2', 'k.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs real drums.' },
    takeaway: 'Safe placement, correct power and level checks, a balance check across both drums and a mono check pass. A brand does not — and more than one setup can pass.',
  },
};

/* Lesson refs (comments only): bg.set.* L5-L7, L17-L19 · bg.snd.* MEINL, LP,
 * membrane physics · bg.mic.* L9-L14 · bg.place.* L8-L16 · bg.ctx.* L20-L27 ·
 * bg.two.* L28-L30 · practice L31-L38. */
const scenarios: MikingScenario[] = [
  {
    id: 'bg.set.1',
    page: 'setting',
    prompt: 'The player holds the bongos between their knees. What must a mic stand, boom and cable stay clear of?',
    options: ['Every finger and palm stroke, and room for the legs to move', 'The front of the pair, so the audience can see both drums clearly', 'The centre block, so the two drums stay level'],
    correct: 'Every finger and palm stroke, and room for the legs to move',
    explain: 'The hands may come from the front, the rear or either side, and a seated player changes leg position. Keep grille, body, clamp, boom and cable out of all of it — and stop the player before anything moves.',
    why: {
      'The front of the pair, so the audience can see both drums clearly': 'How it looks is not the safety question. The space to protect is the player’s: hands, and legs that move.',
      'The centre block, so the two drums stay level': 'Clamp nothing to the block without a made-for-it mount, but the space to keep clear is the player’s: hands and legs.',
    },
  },
  micRatingCheck({ id: 'bg.set.2', page: 'setting', mic: 'bongo mic', loudest: 'the loudest slap' }),
  {
    id: 'bg.set.3',
    page: 'setting',
    prompt: 'Before placing a mic, what is most worth asking the bongo player?',
    options: ['Which drum should lead, and how they hold or mount the pair', 'Which brand of bongos they will be playing at tonight’s show', 'Whether they would retune the hembra to suit the mic'],
    correct: 'Which drum should lead, and how they hold or mount the pair',
    explain: 'Ask which drum must be most prominent, how the pair is held or mounted, and from which sides the hands come — then hear the whole part. Don’t prescribe their position or retune without consent.',
    why: {
      'Which brand of bongos they will be playing at tonight’s show': 'No brand decides the placement. What the part needs, and how the pair is held, do.',
      'Whether they would retune the hembra to suit the mic': 'Tuning is the player’s choice. Fit the mic to the drums, not the drums to the mic.',
    },
  },
  {
    id: 'bg.snd.1',
    page: 'sound',
    prompt: 'On two ideal heads of the same material at the same tension, which head’s shapes sit higher in pitch?',
    options: ['The macho’s: every shape scales with 1 ÷ diameter', 'The hembra’s: the larger head rings higher', 'Neither: size does not change a head’s pitch'],
    correct: 'The macho’s: every shape scales with 1 ÷ diameter',
    explain: 'At the same tension, a head’s every shape sits higher the smaller it is: 8⅝ ÷ 7¼ ≈ 1.19 times higher for the macho. Players tune the pair apart on purpose — ask how they want them to sit.',
    why: {
      'The hembra’s: the larger head rings higher': 'The reverse: a larger head at the same tension sits lower.',
      'Neither: size does not change a head’s pitch': 'Size matters: at the same tension, a smaller head’s shapes sit higher.',
    },
  },
  {
    id: 'bg.snd.2',
    page: 'sound',
    prompt: 'Besides the heads, where does part of a bongo’s sound leave the drum?',
    options: ['Through the open lower end, near the legs or the stand', 'Through the wooden centre block that joins the two drums', 'Nowhere else — the shells are closed at the bottom'],
    correct: 'Through the open lower end, near the legs or the stand',
    explain: 'Bongos are open-bottomed: the stroke pushes the air in the short shell toward the open end, which radiates near the player’s legs or above the stand. A mic below is an optional perspective, not a default.',
    why: {
      'Through the wooden centre block that joins the two drums': 'The block holds the drums together; the sound leaves through the heads and the open ends.',
      'Nowhere else — the shells are closed at the bottom': 'Bongos are open at the bottom: part of the sound leaves there.',
    },
  },
  {
    id: 'bg.snd.3',
    page: 'sound',
    prompt: 'Compared with a strike at the centre, what does a strike near the edge of a head drive?',
    options: ['The shapes with a still line across the head, too', 'Only the lowest shape, but much more strongly than before', 'Nothing — the rim holds the head still there'],
    correct: 'The shapes with a still line across the head, too',
    explain: 'At the centre, every shape with a still line across the head stands still; away from the centre those shapes move, so a strike there drives them too.',
    why: {
      'Only the lowest shape, but much more strongly than before': 'Near the edge the lowest shape moves LESS, and the shapes with still lines across the head join in.',
      'Nothing — the rim holds the head still there': 'Only the very edge is held. A little inside it the head moves, and a strike drives its shapes.',
    },
  },
  {
    id: 'bg.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Two ideal heads of the same material at the same tension: one is 20 % wider than the other. How do its shapes compare?',
    options: ['About 1.2 times lower: pitch follows 1 ÷ diameter', 'About 1.2 times higher: a bigger head rings harder', 'The same: a head’s size does not change its pitch'],
    correct: 'About 1.2 times lower: pitch follows 1 ÷ diameter',
    explain: 'Pitch scales with 1 ÷ diameter at the same tension, so a head 1.2 times wider sits about 1.2 times lower — like the hembra against the macho here. Real pairs are tuned apart by the player, so ask.',
    why: {
      'About 1.2 times higher: a bigger head rings harder': 'A bigger head is lower, not higher: every shape scales with 1 ÷ diameter.',
      'The same: a head’s size does not change its pitch': 'At the same tension, size sets the pitch: every shape scales with 1 ÷ diameter.',
    },
  },
  {
    id: 'bg.mic.1',
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
    id: 'bg.mic.2',
    page: 'microphone',
    prompt: 'A product article promises a “huge stereo image” from two mics in a coincident pair over the bongos. What do you make of it?',
    options: ['A creative option to test, not a requirement for a small pair', 'Bongos should be recorded in wide stereo from now on, whatever the job', 'Stereo is wrong for bongos and is best left alone'],
    correct: 'A creative option to test, not a requirement for a small pair',
    explain: 'It describes a possibility, not an objective requirement. A mono PA or an off-axis audience may hear a mono bongo image more reliably — check the pair in mono.',
    why: {
      'Bongos should be recorded in wide stereo from now on, whatever the job': 'Stereo is an aesthetic choice, not a requirement — and the image must still hold up in mono.',
      'Stereo is wrong for bongos and is best left alone': 'It is a fair option to try. Judge it by ear and in mono.',
    },
  },
  {
    id: 'bg.mic.3',
    page: 'microphone',
    prompt: 'A figure-8 mic sits between the drums, a lobe facing each head. What must you still check on stage?',
    options: ['Where its side nulls face, and what sits behind each lobe', 'Nothing more — a figure-8 mic hears only the drums it faces', 'Only its distance — its pattern takes care of feedback'],
    correct: 'Where its side nulls face, and what sits behind each lobe',
    explain: 'A figure-8 hears front and back equally and rejects at its sides. A wedge or another player behind a lobe is fully heard — it is a pattern experiment, not a feedback solution.',
    why: {
      'Nothing more — a figure-8 mic hears only the drums it faces': 'Both lobes are live, and the sides are where it rejects. Anything in line with a lobe is heard.',
      'Only its distance — its pattern takes care of feedback': 'No pattern guarantees gain before feedback. Map its lobes and nulls against the real monitors.',
    },
  },
  {
    id: 'bg.mic.4',
    page: 'microphone',
    prompt: 'Will a condenser sound more natural on bongos than a dynamic?',
    options: ['Not by type alone: pattern, distance and aim matter more', 'Yes — condensers are simply the natural choice for hand drums', 'Yes, as long as it is a small-diaphragm condenser'],
    correct: 'Not by type alone: pattern, distance and aim matter more',
    explain: 'A small condenser, a compact side-address condenser or a dynamic can each work when placed for the direct sound you need. Neither type is automatically natural or isolating.',
    why: {
      'Yes — condensers are simply the natural choice for hand drums': 'That is a stereotype to test by ear, not a law: placement decides more than the type.',
      'Yes, as long as it is a small-diaphragm condenser': 'Diaphragm size does not make a sound natural. Pattern, distance and aim matter more.',
    },
  },
  {
    id: 'bg.place.1',
    page: 'placement',
    prompt: 'In your shared mic, the macho’s attack hides the hembra’s lower tone. What do you try first?',
    options: ['Shift it slightly toward the hembra, or turn the macho off-axis', 'Boost the low frequencies with EQ until the hembra comes through', 'Ask the player to tune the hembra higher for the show'],
    correct: 'Shift it slightly toward the hembra, or turn the macho off-axis',
    explain: 'Hear the player’s intended dynamics first, then move or re-aim the shared mic so the louder high head is less on-axis. If one channel still cannot balance them, try two spots.',
    why: {
      'Boost the low frequencies with EQ until the hembra comes through': 'No EQ setting follows from head size alone. Move the mic first.',
      'Ask the player to tune the hembra higher for the show': 'Tuning is the player’s. Balance the drums with the mic’s position.',
    },
  },
  {
    id: 'bg.place.2',
    page: 'placement',
    prompt: 'Soft finger work disappears; only the accents come through. A first move?',
    options: ['Move safely closer or re-aim, then check the soft passages', 'Add a second mic on the macho to catch the finger work', 'Squash the loud accents with a compressor before anything else'],
    correct: 'Move safely closer or re-aim, then check the soft passages',
    explain: 'Position the mic to hear the whole pair without a hand shadowing or striking it, check gain and nearby spill, and consider a closer directional placement if it is safe.',
    why: {
      'Add a second mic on the macho to catch the finger work': 'A second channel adds spill and interaction. Fix the first mic’s position before adding one.',
      'Squash the loud accents with a compressor before anything else': 'Processing comes after placement. Move the mic so the soft strokes are heard.',
    },
  },
  {
    id: 'bg.place.3',
    page: 'placement',
    prompt: 'A starting point says “just above the heads”. How far above is that?',
    options: ['No set number — start safely clear of the hands, then listen', 'Exactly 5 cm above the heads, measured to the grille', 'A hand’s width above the heads, about 10 cm, on a pair of bongos'],
    correct: 'No set number — start safely clear of the hands, then listen',
    explain: '“Just above” does not supply a safe number of inches. The player’s hand arc and the mic’s size set the minimum clearance; move and re-aim after hearing the full passage.',
    why: {
      'Exactly 5 cm above the heads, measured to the grille': 'No source gives a number. Clearance from the hands comes first, then listening.',
      'A hand’s width above the heads, about 10 cm, on a pair of bongos': 'Players and mics differ. Start safely clear of this player’s hands, then listen.',
    },
  },
  {
    id: 'bg.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The player sits with the pair between the knees. Where must the stand’s base and the cable go?',
    options: ['Away from the legs, with room for them to move', 'Under the drums, between the player’s feet', 'Taped to the centre block, out of sight'],
    correct: 'Away from the legs, with room for them to move',
    explain: 'Leave room for a seated player to change leg position, and route cables away from feet and paths.',
    why: {
      'Under the drums, between the player’s feet': 'That is where the legs and feet move. Keep the base and cable out of it.',
      'Taped to the centre block, out of sight': 'Clamp or tape nothing to the drums without the owner’s OK; route the cable away from the player.',
    },
  },
  {
    id: 'bg.ctx.1',
    page: 'context',
    prompt: 'On a loud stage, the bongos are buried under drum-kit spill in a distant mic. What helps?',
    options: ['A directional mic close enough for direct sound, clear of the hands', 'A second distant mic to pick up more of the bongos', 'Turning up the bongo monitor so that the player plays the drums harder'],
    correct: 'A directional mic close enough for direct sound, clear of the hands',
    explain: 'The kit, vocal mics, cymbals and nearby percussion can dominate a distant bongo mic. Move a directional mic close enough for a useful direct-to-spill ratio, with safe clearance.',
    why: {
      'A second distant mic to pick up more of the bongos': 'Another distant mic hears more of the same spill — and adds feedback risk.',
      'Turning up the bongo monitor so that the player plays the drums harder': 'More monitor level means more stage sound and less margin before feedback.',
    },
  },
  {
    id: 'bg.ctx.2',
    page: 'context',
    prompt: 'A figure-8 between the bongos has a floor wedge in line with one of its lobes. Is the wedge rejected?',
    options: ['No — that lobe is fully live; it rejects at its sides', 'Yes — a figure-8 rejects whatever sits behind it', 'Yes, once the mic is turned to face the audience'],
    correct: 'No — that lobe is fully live; it rejects at its sides',
    explain: 'A figure-8 has two active lobes and side nulls. Place monitors by the actual pattern; a supercardioid’s or hypercardioid’s rear differs again.',
    why: {
      'Yes — a figure-8 rejects whatever sits behind it': 'Its back lobe is as live as its front. It rejects at its sides.',
      'Yes, once the mic is turned to face the audience': 'Turning the mic moves its lobes too. Map where the lobes and nulls actually face.',
    },
  },
  {
    id: 'bg.ctx.studio',
    page: 'context',
    prompt: 'Quiet studio, one performer. What could justify raising the shared mic a little farther above the pair?',
    options: ['A more even blend of both drums, in a room worth hearing', 'A farther mic will make the bongos sound louder overall', 'Distance takes the room’s sound out of the bongo mic'],
    correct: 'A more even blend of both drums, in a room worth hearing',
    explain: 'A shared mic at a greater distance can represent both drums more evenly in a quiet room — and gathers more room and other instruments.',
    why: {
      'A farther mic will make the bongos sound louder overall': 'Farther means less direct sound. Distance is for balance, not level.',
      'Distance takes the room’s sound out of the bongo mic': 'The reverse: the farther the mic, the more room it hears.',
    },
  },
  {
    id: 'bg.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A mic above the heads, between the drums, hears more of which part of the sound?',
    options: ['The fingers’ attack on both heads', 'The open lower ends, near the legs', 'The centre block between the drums'],
    correct: 'The fingers’ attack on both heads',
    explain: 'The attack starts where the fingers meet the heads, so a mic above them and facing them hears more of it — a tendency, and players vary.',
    why: {
      'The open lower ends, near the legs': 'Those radiate below the drums, away from a mic above them.',
      'The centre block between the drums': 'The block joins the drums; the heads and open ends radiate the sound.',
    },
  },
  {
    id: 'bg.two.1',
    page: 'twoMic',
    prompt: 'You flip the polarity of mic B. What happens to the arrival-time difference?',
    options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so the two arrivals now line up in time again', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Polarity inversion reverses the signal’s sign. It does not remove a delay caused by sound reaching the mics at different times.',
    why: {
      'It drops to zero, so the two arrivals now line up in time again': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still where they were.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  },
  {
    id: 'bg.two.2',
    page: 'twoMic',
    prompt: 'Spot B hears a macho stroke 1 ms after spot A. Summed at equal level, same polarity: the first notch (simplified model)?',
    options: ['500 Hz, then 1.5 kHz, 2.5 kHz …', '1 kHz, then 2 kHz, 3 kHz, 4 kHz …', '250 Hz, then 750 Hz, 1.25 kHz …'],
    correct: '500 Hz, then 1.5 kHz, 2.5 kHz …',
    explain: 'The first cancellation is where the delay is half a period: f = 1 ÷ (2 × 0.001 s) = 500 Hz, then odd multiples. Inverted, the notches sit at 0, 1 kHz, 2 kHz … instead.',
    why: {
      '1 kHz, then 2 kHz, 3 kHz, 4 kHz …': 'That is the INVERTED set (whole multiples of 1 ÷ Δt). Same polarity cancels where the delay is half a period: 500 Hz.',
      '250 Hz, then 750 Hz, 1.25 kHz …': 'That needs a 2 ms delay. With 1 ms the first notch is at 1 ÷ (2 × 0.001 s) = 500 Hz.',
    },
  },
  {
    id: 'bg.two.3',
    page: 'twoMic',
    prompt: 'Two mics in a coincident pair above the bongos: what happens to the arrival-time difference between them?',
    options: ['Close to none — the capsules sit at almost one point', 'It doubles, since the two mics point two different ways', 'It is set by the polarity switch on one mic'],
    correct: 'Close to none — the capsules sit at almost one point',
    explain: 'A close coincident pair minimises the pair’s own arrival differences — it gives an image, not isolation — but it still interacts with other open mics and the room.',
    why: {
      'It doubles, since the two mics point two different ways': 'Aim does not create delay; distance does. Coincident capsules share almost one point.',
      'It is set by the polarity switch on one mic': 'Polarity has no time in it. Only the capsules’ positions set the delay.',
    },
  },
  {
    id: 'bg.two.4',
    page: 'twoMic',
    prompt: 'With two spots, flipping B’s polarity makes the bongos sound bigger — and 3 dB louder. What do you conclude?',
    options: ['Not yet: match the levels, then compare both states in mono', 'Inverted is better, so keep it that way for the rest of the show', 'Normal polarity was wrong, because it was quieter'],
    correct: 'Not yet: match the levels, then compare both states in mono',
    explain: 'A louder version almost always sounds “better” at first. Compare at matched level, in mono, with the other open mics, before you decide.',
    why: {
      'Inverted is better, so keep it that way for the rest of the show': 'A louder version almost always sounds better at first. Compare at matched level before deciding.',
      'Normal polarity was wrong, because it was quieter': 'Quieter is not wrong. Match levels, then judge which state keeps both drums whole.',
    },
  },
  {
    id: 'k.prac.gain',
    page: 'practice',
    prompt: 'Typical strokes sit well below the overload light, but the player’s loudest accents light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader well down until the loudest accents sound clean', 'Ask the player to play the accents softer during the show'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set gain for the loudest strokes with headroom, then verify the softest. A lowered fader does not undo clipping at the input; use a pad only as the manual permits.',
    why: {
      'Pull the channel fader well down until the loudest accents sound clean': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the player to play the accents softer during the show': 'Set gain for the strongest strokes the player intends to play.',
    },
  },
  {
    id: 'k.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second channel to a shared bongo mic?',
    options: ['A real balance problem one mic cannot fix, and a mono sum that holds', 'Two channels give the mix engineer more options to work with later on', 'The bongos need more level than one mic can give them'],
    correct: 'A real balance problem one mic cannot fix, and a mono sum that holds',
    explain: 'A shared single mic avoids interaction between two bongo channels. Add a second only for a real balance or control problem, then check it alone, in the blend and in mono.',
    why: {
      'Two channels give the mix engineer more options to work with later on': 'More channels add spill and interaction. A second mic should earn its place.',
      'The bongos need more level than one mic can give them': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'k.mix.1',
    page: 'practice',
    prompt: 'A spot is placed “just beyond the rim, aimed at the head”. Before you trust it, what else do you check?',
    options: ['Clearance from every stroke, and the other drum’s spot distance', 'The brand of the bongos, so the spot matches them', 'Nothing more — that wording already places the mic exactly where it goes'],
    correct: 'Clearance from every stroke, and the other drum’s spot distance',
    explain: 'Spots go at a safe, comparable distance on both drums; clearance from every finger, palm and leg motion comes first.',
    why: {
      'The brand of the bongos, so the spot matches them': 'Brands do not set placement. Clearance and comparable distances do.',
      'Nothing more — that wording already places the mic exactly where it goes': 'Words like “just beyond” are a region to begin in. Clearance and listening finish the job.',
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
    prompt: 'Two bongo spots sound thin together. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning the later mic up until it matches the earlier one'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the later mic up until it matches the earlier one': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  },
];

/* The lesson's troubleshooting table (L33-L37) + its "overly sharp accents" paragraph (L15). */
const symptoms: Symptom[] = [
  {
    id: 's.mask',
    observation: 'The macho masks the hembra',
    firstChecks: 'Player dynamics, central aim, the drums’ different on-axis positions.',
    options: ['The player’s dynamics and the mic’s aim between the drums', 'Boost the lows until the hembra comes forward', 'Swap the drums over so the hembra sits nearer the shared mic'],
    correct: 'The player’s dynamics and the mic’s aim between the drums',
    explain: 'Re-aim toward the hembra, or use separate control.',
    why: {
      'Boost the lows until the hembra comes forward': 'No EQ setting follows from head size. Re-aim first.',
      'Swap the drums over so the hembra sits nearer the shared mic': 'The setup is the player’s. Move the mic, not the drums.',
    },
  },
  {
    id: 's.soft',
    observation: 'Soft finger work is inaudible',
    firstChecks: 'Too much distance or spill; gain set only by loud hits?',
    options: ['Distance and spill, and whether gain was set on loud hits only', 'Ask the player to play the soft strokes louder', 'Add a mic under the drums to catch the quiet finger work from below'],
    correct: 'Distance and spill, and whether gain was set on loud hits only',
    explain: 'Move safely closer, adjust orientation or pattern, verify headroom and the soft passages.',
    why: {
      'Ask the player to play the soft strokes louder': 'The part is the player’s. Make the mic hear it.',
      'Add a mic under the drums to catch the quiet finger work from below': 'The fingers play on top; a mic below hears the open ends, not finger detail.',
    },
  },
  {
    id: 's.thin',
    observation: 'The hembra sounds thin only with the second mic',
    firstChecks: 'Does it happen in the combined mono channels?',
    options: ['The mono sum: move or aim one mic, then compare polarity', 'Turn the second mic up until the hembra fills out', 'Invert the second mic, since that one is usually the wrong one'],
    correct: 'The mono sum: move or aim one mic, then compare polarity',
    explain: 'Move or aim one mic and compare polarity at real levels; check the other open mics too.',
    why: {
      'Turn the second mic up until the hembra fills out': 'More level does not fix a cancellation; it makes the thin sound louder.',
      'Invert the second mic, since that one is usually the wrong one': 'No mic is “usually wrong”. Compare BOTH states at matched level, in mono.',
    },
  },
  {
    id: 's.feedback',
    observation: 'Stage feedback rises when the bongo mic is opened',
    firstChecks: 'Loudspeaker and monitor axes, open mic count, distance?',
    options: ['Monitor and speaker axes, open mics and mic distance', 'Raise the bongo monitor so that the player hears more of it', 'Open a second bongo mic to share the level'],
    correct: 'Monitor and speaker axes, open mics and mic distance',
    explain: 'Coordinate mic and speaker placement with the operator; use only the channels you need. Never provoke feedback.',
    why: {
      'Raise the bongo monitor so that the player hears more of it': 'More monitor level means less margin before feedback.',
      'Open a second bongo mic to share the level': 'Each open mic adds feedback risk. Use only what you need.',
    },
  },
  {
    id: 's.contact',
    observation: 'A mic or cable gets in the way of the hands or knees',
    firstChecks: 'Was clearance checked during the complete passage?',
    options: ['Stop, move the rig, and repeat the clearance check', 'Keep going carefully and fix it after the song', 'Ask the player to keep their hands away from it'],
    correct: 'Stop, move the rig, and repeat the clearance check',
    explain: 'Clearance comes first: stop the player before anything moves, and check again during the full passage.',
    why: {
      'Keep going carefully and fix it after the song': 'Clearance comes first: stop before any mic moves.',
      'Ask the player to keep their hands away from it': 'Never ask the player to play around the mic. Move the mic.',
    },
  },
  {
    id: 's.sharp',
    observation: 'Accents sound overly sharp',
    firstChecks: 'A slight off-axis aim or more distance — while the soft strokes stay clear.',
    options: ['A slight off-axis aim or more distance, keeping soft strokes', 'Cut the highs hard with EQ before trying anything else at all', 'Ask the player to play the accents more softly'],
    correct: 'A slight off-axis aim or more distance, keeping soft strokes',
    explain: 'Moving the mic is the first step; a high-frequency cut is an optional later adjustment.',
    why: {
      'Cut the highs hard with EQ before trying anything else at all': 'Placement first; EQ is a later, optional step.',
      'Ask the player to play the accents more softly': 'The accents are part of the music. Move the mic.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'k.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic setup in the order you would do them.',
    steps: [
      { text: 'Ask the player: which drum leads, seated or on a stand, from which sides the hands come?', early: 'Start with the player and the drums.' },
      { text: 'Choose a mic whose pattern, power, size and mount suit the pair and the show', early: 'Choose the mic once you know the part and the setup.' },
      { text: 'Have the player stop; mount the mic; check clearance from fingers, palms and legs', early: 'You need a chosen mic before you can mount it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is mounted and its cable connected — with the outputs muted first.' },
      { text: 'Set input gain on typical AND strongest strokes, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare positions one change at a time, at matched levels', early: 'Compare only once the level is set safely — and at matched levels, so louder does not win.' },
      { text: 'Keep the simplest position that works, with safe clearance', early: 'Decide last, after comparing.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it with headroom for the loudest strokes, then verify the softest.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'This input gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point for this kind of mic, from the right head', role: 'required', feedback: 'Say why it is a good place to begin, and which head it is read from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, mount and cable stay clear of the fingers, palms and legs', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on bongos', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const BASS_REASON: SetupReason = { id: 'r.bass', label: 'It will give the most bass of any position on the pair', role: 'wrong', feedback: 'Bass emphasis is not a passing reason, and no position always gives the most bass.' };

const setupTasks: SetupTask[] = [
  {
    id: 'k.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Bongos between a seated player’s knees, a quiet studio, one performer. Phantom power is available.',
    setups: [
      { id: 'a', label: 'One compact dynamic between the heads, just above them, aimed down', ok: true, power: 'none', feedback: 'A recommended starting point: both drums on one channel; a dynamic needs no phantom.' },
      { id: 'b', label: 'Two small condensers as a coincident pair above the drums', ok: true, power: 'phantom', feedback: 'An image of the pair with little arrival difference; phantom is available. Check it in mono.' },
      { id: 'c', label: 'A clip-on condenser at each rim, with the player’s OK', ok: true, power: 'phantom', feedback: 'Independent control in little space; it needs the phantom power this input has.' },
      { id: 'd', label: 'A mic under the pair, between the player’s knees', ok: false, power: 'none', feedback: 'That is where the legs move — and an unsupported bottom mount. Keep the space clear.' },
      { id: 'e', label: 'A mic just above the macho, inside the finger path', ok: false, power: 'none', feedback: 'Inside the hand path: the mic would be struck.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.room', label: 'In a quiet room, a little distance can blend both drums', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point, clearance, and power that matches the mic.',
  },
  {
    id: 'k.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · Bongos on a stand on a loud stage, near the drum kit. The spare inputs have NO phantom power.',
    setups: [
      { id: 'a', label: 'A compact dynamic spot for each drum, outside the hands', ok: true, power: 'none', feedback: 'Close, directional, independent control on a loud stage; dynamics need no phantom.' },
      { id: 'b', label: 'One compact dynamic between the heads, just above, aimed down', ok: true, power: 'none', feedback: 'A recommended starting point; a dynamic needs no phantom.' },
      { id: 'c', label: 'Two small condensers as a coincident pair above the drums', ok: false, power: 'phantom', feedback: 'A fair studio idea, but these inputs have no phantom power.' },
      { id: 'd', label: 'A clip-on condenser at each rim', ok: false, power: 'phantom', feedback: 'It needs phantom power these inputs lack.' },
      { id: 'e', label: 'One mic a metre above to catch the whole setup', ok: false, power: 'none', feedback: 'Too distant near a loud kit: more spill and feedback risk.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.spill', label: 'Close, directional pickup helps against kit spill and feedback', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'Two close, dynamic setups pass. What passes is the reasoning: a sensible starting point, clear of the player, powered by what these inputs can supply.',
  },
];

const predictions: HandLesson['predictions'] = {
  sound: { prompt: 'Before you step through: when the fingers push the head down, where does the air inside the short shell go?', options: ['Down and out of the open end', 'Up, back out through the head', 'Nowhere — the air stays still'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch the air.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you shift the shared mic a little toward the hembra. What changes?', options: ['More hembra against the macho', 'More macho attack', 'Nothing until it is over the hembra'], after: 'Moving toward a drum tends to raise it against the other — a tendency to check by ear, with every stroke.' },
  context: { prompt: 'Where can this mic, aimed at the hembra, best reject the floor wedge in front?', options: ['Straight behind the mic', 'Toward its rear, off to one side', 'At the sides of the mic'], after: 'Now tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Of a pair of bongos, which drum is the macho?',
    options: ['The smaller, higher drum', 'The larger, lower drum', 'The block that joins them'],
    correct: 'The smaller, higher drum',
    explain: 'The smaller drum is the macho, the larger the hembra.',
    why: {
      'The larger, lower drum': 'That is the hembra. The macho is the smaller one.',
      'The block that joins them': 'That is the centre block. The macho is the smaller drum.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What is under each bongo’s head?',
    options: ['A short shell, open at the bottom', 'A shell closed by a second head', 'A port cut for a microphone'],
    correct: 'A short shell, open at the bottom',
    explain: 'Bongos are a pair of small open-bottomed drums.',
    why: {
      'A shell closed by a second head': 'Bongos have one head each; the bottom is open.',
      'A port cut for a microphone': 'There is no port: the shell is simply open at the bottom.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Two heads of the same material at the same tension: which sounds higher?',
    options: ['The smaller head, the macho', 'The larger head, the hembra', 'Neither — size makes no difference'],
    correct: 'The smaller head, the macho',
    explain: 'At the same tension a smaller head’s shapes all sit higher (pitch scales with 1 ÷ diameter).',
    why: {
      'The larger head, the hembra': 'The reverse: the larger head sits lower at the same tension.',
      'Neither — size makes no difference': 'Size matters: pitch scales with 1 ÷ diameter at the same tension.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A strike near the edge, compared with one at the centre, drives…',
    options: ['Shapes with a still line across the head, too', 'Only the lowest shape, and more strongly', 'Nothing — the rim holds the whole of the head still'],
    correct: 'Shapes with a still line across the head, too',
    explain: 'At the centre, every shape with a still line across the head stands still; near the edge those shapes join in.',
    why: {
      'Only the lowest shape, and more strongly': 'Near the edge the lowest shape moves less; others join in.',
      'Nothing — the rim holds the whole of the head still': 'Only the very edge is held; a little inside it the head moves.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Where should a bongo mic’s cable run?',
    options: ['Away from the legs, the feet and the player’s path', 'Along the centre block between the drums, taped down', 'Under the drums, between the player’s knees'],
    correct: 'Away from the legs, the feet and the player’s path',
    explain: 'Confirm strain relief and a route nobody can trip on, away from the player’s legs and feet.',
    why: {
      'Along the centre block between the drums, taped down': 'Tape nothing to the drums without the owner’s OK; route the cable away from the player.',
      'Under the drums, between the player’s knees': 'That is where the legs move. Route it away.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your mic is rated to a very high maximum SPL. What does that tell you about sitting beside the bongos through a long soundcheck?',
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
const spot = (id: string) => BONGO_ZONES.find((z) => z.id === id)!.start;

export const M04B_LESSON: HandLesson = {
  id: 'M04b',
  labId: 'drums',
  title: 'Bongos',
  subtitle: 'A small pair: one mic between, two spots, or clip-ons',
  noun: { one: 'pair of bongos', many: 'bongos' },
  copy: handCopy(BONGO_WORDS),
  model: BONGO_MODEL,
  micTypeIds: ['hdDynCard', 'hdDynHyper', 'hdSdc', 'hdClip'],
  zones: BONGO_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT THEY ARE', text: 'Bongos are a connected pair of small, open-bottomed hand drums: the smaller macho and the larger hembra, joined by a centre block.', src: 'MEINL-BONGO' },
    { title: 'WHERE YOU MEET THEM', text: 'In Latin, Afro-Cuban and popular music, in the studio and on stage. The player may sit with the pair between the knees, or play standing with it on a stand.', src: 'LESSON' },
    { title: 'WHAT THEY DO IN THE MUSIC', text: 'Two contrasting voices — the macho high, the hembra lower — in fast, quiet finger work, open tones, muted touches and louder accents. The player may move between the bongos and other percussion.', src: 'LESSON' },
    { title: 'THEIR SIZE', text: 'Small heads, around 7 and 8½ in across. This lab draws a 7¼ in macho and an 8⅝ in hembra.', src: 'LP-GEN2' },
  ],
  sound: {
    stages: [
      { title: 'The fingers strike', text: 'The player’s fingers strike the head — often near the edge, sometimes with the whole hand. That brief contact is where the ATTACK begins.' },
      { title: 'The head is pushed in', text: 'The head bows down into the drum — most at the centre, not at all at the rim: its lowest vibration shape, drawn here many times larger than it really moves. Then it springs back and rings.' },
      { title: 'The air is pushed down', text: 'The head pushes the air in the short shell down and out of the open lower end.' },
      { title: 'Sound leaves the drum', text: 'Sound leaves from the head — up and around — and from the open lower end, near the player’s legs or above the stand. Heads and open ends are different perspectives.' },
    ],
    attack: 'The start of the sound: the fingers’ brief contact with the head. A mic above the heads and facing them tends to hear more of it — the fast finger work, the slaps and accents.',
    body: 'The ringing that follows: the head and the air in the short shell, part of it leaving through the open end. The macho rings higher than the hembra; the player tunes the pair apart. Both are tendencies to check by ear.',
    head: { diameterMm: 8.625 * IN, rods: D.lugs.mm, label: '8⅝ in hembra head, seen from above', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'drums', label: 'the bongos (the same drawing as every other page)', short: 'BONGOS', note: 'The macho on the player’s left, the hembra on the right, joined by the centre block — between the knees here, or on a stand.', prov: { kind: 'sourced', src: 'LP-GEN2', quote: '7-1/4″ and 8-5/8″ drums' }, tag: 'THE DRUMS', scene: 'all' },
      { id: 'player', label: 'the player, seated', short: 'PLAYER', note: 'Hands from the front, the rear or either side; legs beside the drums that change position. Nothing of yours goes there.', prov: { kind: 'illustrative', reason: 'a seated player; no source gives the reach' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'kit', label: 'the drum kit', short: 'DRUM KIT', note: 'A loud neighbour that can dominate a distant bongo mic.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'SPILL', scene: 'all' },
      { id: 'bass', label: 'the bass amp', short: 'BASS AMP', note: 'Low-frequency spill into a bongo mic, especially a distant one.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'SPILL', scene: 'all' },
      { id: 'perc', label: 'other percussion (congas, a bell)', short: 'PERCUSSION', note: 'The player may move between instruments: a fixed stand may not keep covering a moving pair, and their path stays clear.', prov: { kind: 'illustrative', reason: 'a typical percussion setup; no source gives positions' }, tag: 'MOVEMENT', scene: 'all' },
      { id: 'vox', label: 'a vocal mic', short: 'VOCAL MIC', note: 'Another open mic that hears the bongos — include it at realistic level when you check the blend.', prov: { kind: 'illustrative', reason: 'a typical band layout; no source gives positions' }, tag: 'OPEN MIC', scene: 'all' },
      { id: 'wedge', label: 'the player’s floor wedge', short: 'WEDGE', note: 'In front of the player, facing them — below and in front of a mic aimed at the heads.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'sidefill', label: 'a side fill', short: 'SIDE FILL', note: 'A loud monitor at the side of the stage, off to the side of a mic aimed at a head.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'In a mono PA or a wide room, a mono bongo image may reach every listener more reliably.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet room, a shared mic a little farther away can represent both drums more evenly — with more of the room.', prov: { kind: 'illustrative', reason: 'a generic room; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a floor wedge in front of the player, the kit, vocal mics and other percussion nearby, and the PA facing the audience. A directional mic close enough for a useful direct-to-spill ratio — a second spot only for a real balance problem.',
    studio: 'STUDIO: one performer, no wedges; one mic between and above the heads, and a little nearer or farther to compare. A figure-8 or a coincident pair are other images to explore.',
  },
  diagnostic,
  practice: {
    task: 'Choose a setup for a given pair and performance, describe an alternative, and explain what would justify a second channel. With real drums and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'drum', label: 'Pair (sizes, which side is which)', kind: 'text' },
      { id: 'setup', label: 'Setup', kind: 'choice', choices: ['between the knees', 'on a stand'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['compact dynamic', 'small condenser', 'clip-on condenser', 'figure-8', 'other'] },
      { id: 'pattern', label: 'Pattern', kind: 'text' },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, from which head', kind: 'text' },
      { id: 'aim', label: 'Aim', kind: 'text' },
      { id: 'notes', label: 'What you heard on each drum (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The centre block’s width, the shells’ height and the heads’ height seated or on a stand — drawing defaults.', dims: ['block', 'shellH', 'seatedH', 'standH'] },
    { text: 'The rims and the number of tension rods — drawing defaults, never stated.', dims: ['rimRise', 'rimT', 'lugs'] },
    { text: 'Which side the macho sits — a common layout, drawn on the player’s left; players differ.', dims: [] },
    { text: 'The hands’ and legs’ envelopes — ILLUSTRATIVE, for the owner to approve.', dims: ['handsUp'] },
    { text: 'No source gives a bongo mic distance: the “just above” band is a drawing default.', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'wedge', label: 'the player’s floor wedge, in front of the pair, facing them', short: 'WEDGE', p: { x: 1000, y: 0, z: 0 }, lift: 150, faces: { x: -1, y: 0, z: 0 }, note: 'Below and in front of a mic aimed at a head — where an off-axis null can help.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
      { id: 'sidefill', label: 'a side fill at the side of the stage, facing across', short: 'SIDE FILL', p: { x: -250, y: 0, z: -1900 }, lift: 1100, faces: { x: 0, y: 0, z: 1 }, note: 'Off to the side of the mic: one null cannot face every monitor — distance, level and fewer open mics matter too.', prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. We could not find a recommended bongo mic distance, so the starting points here are regions to begin in: safely clear of the hands, then listen. Every pair, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: mic patterns and the two-mic comb as textbook shapes, and head motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  hand: {
    drum: HEMBRA,
    drums: { macho: MACHO, hembra: HEMBRA },
    shellLook: 'staved',
    headLook: 'rawhide',
    tool: 'hand',
    variantKey: 'SETUP',
    figure: { view: 'top', badge: 'A pair of bongos — 7¼ and 8⅝ in — seen from above, the player at the left', label: 'Top view of a pair of bongos: the smaller macho on the player’s left and the larger hembra on the right, rawhide heads in chrome rims, joined by a wooden centre block.' },
    partsBadge: 'A pair of bongos · tap a part to name it',
    partsPrompt: 'Tap any part — or step through PART — to see what it is and what it does. Switch SETUP between the knees and a stand. There is nothing to answer on this page.',
    partsNote: 'The fingers strike the heads; the open lower ends let out part of the sound near the legs or the stand. The next page shows how.',
    soundBadge: 'The order of events, not their speed · head motion drawn much larger than it really is · silent',
    faceLabel: 'the hembra head',
    strikeWord: 'FINGERS',
    face: { kind: 'crown', lugs: D.lugs.mm },
    facePoints: [
      { id: 'c', label: 'CENTRE', frac: 0, blurb: 'The exact centre of the head.' },
      { id: 'h', label: 'HALFWAY', frac: 0.5, blurb: 'Halfway from the centre to the rim.' },
      { id: 'e', label: 'NEAR THE EDGE', frac: 0.85, blurb: 'Close to the rim.' },
    ],
    openEnd: { default: true },
    strokes: {
      title: 'Two heads, two sizes',
      key: 'HEAD',
      intro: 'Switch HEAD to compare the macho and the hembra drawn to the same scale, and where the fingers land. The bars are physics; the size difference is the drums’.',
      badge: 'A simplified head · both drawn to one scale · bars = how strongly that spot drives each shape',
      items: [
        { id: 'machoEdge', label: 'MACHO · NEAR THE EDGE', short: 'MACHO EDGE', frac: 0.8, tool: 'tips', drum: 'macho', text: 'The fingertips near the edge of the smaller head. On heads at the same tension, every shape of the macho sits about 1.19 times higher than the hembra’s (8⅝ ÷ 7¼).' },
        { id: 'hembraEdge', label: 'HEMBRA · NEAR THE EDGE', short: 'HEMBRA EDGE', frac: 0.8, tool: 'tips', drum: 'hembra', text: 'The fingertips near the edge of the larger head: the same shapes, each lower than the macho’s at the same tension.' },
        { id: 'hembraMid', label: 'HEMBRA · HALFWAY', short: 'HEMBRA MID', frac: 0.45, tool: 'fingers', drum: 'hembra', text: 'Fingers halfway in: the lowest shapes take more of the stroke.' },
      ],
      note: 'Pitch scales with 1 ÷ diameter at the same tension — but players tune the pair apart on purpose, and how the fingers meet the head (not shown here) changes the sound too. Ask the player how they want the two drums to sit.',
    },
    soundReveal: 'The head moving down pushes the air in the short shell out of the open end — that is where part of the bongo’s sound leaves, near the legs or the stand.',
    plan: {
      box: { u0: -2000, u1: 2300, v0: -1400, v1: 1300 },
      things: [
        { id: 'drums', kind: 'drums', u: 0, v: 0, scene: 'all' },
        { id: 'player', kind: 'player', u: -430, v: 0, scene: 'all' },
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
      looking: 'Plan · the band from above · the player behind the bongos',
      prompt: 'Tap anything around the bongos — or step through ITEM — to see what it means for a bongo mic. There is nothing to answer yet.',
      intro: 'The bongos sit in front of the player, with louder neighbours around them. Everything near them is either the player’s space or a source of spill.',
      label: 'The band from above: the bongos in the middle with the seated player behind them, a drum kit and a bass amp behind the player, other percussion to the player’s right and a vocal mic in front.',
    },
    before: {
      ask: 'Which drum should be most prominent, does the player sit with the pair between the knees or stand at a stand, and from which sides do the hands come? Ask for the complete part — quiet figures and the strongest accents — and listen before placing a mic. Don’t prescribe their position or retune without consent.',
      asIs: 'The pair, its tuning and how it is held are the player’s. Clamp nothing to a rim or the centre block unless the mount is made for it and the owner agrees.',
    },
    worked: { default: 'bg.shared' },
    clearWords: 'Clear of every finger and palm stroke, from every side the hands come, and of the legs or the stand. Clearance comes first, before any number — and the player stops before a real mic moves.',
    ideas: {
      hdDynCard: 'Ideas to try with this kind of mic: one mic between and above the heads first; compare it centred, a little toward the macho, a little toward the hembra, and a little farther up — one change at a time.',
      hdDynHyper: 'Ideas to try with this kind of mic: a spot for each drum at a safe, comparable distance — its narrow pattern helps against kit spill. Check each alone, then the pair in mono.',
      hdSdc: 'Ideas to try with this kind of mic: in a quiet room, between and above the pair, or two of them as a coincident pair — then check the image in mono.',
      hdClip: 'Ideas to try with this kind of mic: one clip-on at each rim, outside the hands — little stage space. Check the clamp fits, for vibration, cable strain and every finger motion.',
    },
    placeLearn: [
      'What you just did, in words. After our research, each blue zone is a region where we recommend you begin with that kind of mic. We could not find a recommended bongo distance, so “just above” here means safely clear of the hands — then listen. They are starting points, not rules.',
      'Height, distance and angle are separate variables: change one at a time and have the player play the whole part again. A starting point that names an aim counts only while the mic faces that way. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
      'Clearance comes first. Stop the player before moving a mic; keep the grille, body, clamp, boom and cable out of every finger and palm stroke, and leave room for a seated player’s legs. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where to keep clear; check again during vigorous playing.',
      'A shared mic farther away can represent both drums more evenly in a quiet room — and gathers more room and other instruments; a close mic gives more direct sound but may favour one stroke or one drum. A figure-8 between the drums, a lobe toward each head, is another idea — map its back lobe and side nulls first.',
    ],
    context: {
      pose: spot('bg.spot.hembra'),
      looking: 'Side view · a spot just beyond the hembra’s rim, aimed back at its head',
      prompt: 'The wedge stays where the player needs it. Tilt the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still faces the head.',
      learn: [
        { title: 'HOW MUCH ROOM', text: 'Studio: one mic between and above the heads, compared a little nearer and farther; a figure-8 or a coincident pair are other images. Live: a directional mic close enough for a useful direct-to-spill ratio.' },
        { title: 'HOW MANY MICS', text: 'Studio: a second spot only for a real balance problem. Live: compact, stable pickup — separate spots only when independent control is needed.' },
        { title: 'WHAT THE PART NEEDS', text: 'A pattern label cannot guarantee gain before feedback: open channels, distance, speaker positions and monitor level all matter. Sound-check at the intended level with the operator.' },
        { title: 'MOUNTING', text: 'A fixed stand may not keep covering a moving pair; a clip may transfer vibration. Coordinate stands and cables with the player and test the full range of motion.' },
      ],
      closing: 'Feedback is a loop of microphone, loudspeaker, room and gain. A figure-8 has two live lobes and side nulls; a supercardioid’s rear differs from a cardioid’s. Stop if feedback begins — never provoke it.',
    },
    pairs: [
      {
        id: 'spots',
        label: 'A spot on each drum',
        blurb: 'Each spot hears its own drum — and the other one, a little later. A macho stroke reaches B, beside the macho, first; A, beside the hembra, hears it later.',
        A: { typeId: 'hdDynCard', pattern: 'cardioid', pose: spot('bg.spot.hembra') },
        B: { typeId: 'hdDynCard', pattern: 'cardioid', pose: spot('bg.spot.macho') },
        source: 'r.macho',
      },
      {
        id: 'xy',
        label: 'A coincident pair',
        blurb: 'Two cardioids at almost one point above the drums, one angled toward each head: the arrival difference between them stays close to none. Move one to see what spacing does.',
        A: { typeId: 'hdSdc', pattern: 'cardioid', pose: { p: { x: 70, y: HEAD_Y - 150, z: BETWEEN.z }, az: 40, el: -55 } },
        B: { typeId: 'hdSdc', pattern: 'cardioid', pose: { p: { x: 70, y: HEAD_Y - 150, z: BETWEEN.z }, az: -40, el: -55 } },
        source: 'r.macho',
      },
    ],
    pairLearn: [
      'A shared single mic avoids interaction between two bongo channels. With two mics, each picks up both heads at different levels and delays. Hear each alone, combine at the intended level, and sum to mono.',
      'If the high drum thins, the low drum loses weight or the image jumps, move or re-aim the mics first; a polarity switch is a diagnostic comparison, not a guarantee. If the pair also reaches the overheads or vocal mics, include them at realistic levels.',
      'What you just saw: a close coincident pair keeps its own arrival difference near zero — it gives an image, not isolation, and still interacts with other mics and the room. Spaced spots comb; polarity moves the notches, it does not remove the delay.',
    ],
    pairWarn: 'The notch POSITIONS follow from the arrival-time difference; their DEPTH depends on the two levels, which this model takes from distance alone (1/r) — that does not hold this close to a drumhead, so read the depths as illustrative only. Judge the pair by ear, in mono, at matched levels.',
  },
};
