/**
 * A10 HARMONICA (acoustic and amplified) — the lesson as DATA. Words from
 * the owner's lesson (docs/labs/miking/source_text/Harmonica-Miking-
 * Technique.txt; "L<n>" in comments only), research in
 * docs/labs/miking/harmonica/ and the speaker module's (speaker_leslie/),
 * corrections in CORRECTIONS_LOG.md (HM-01 …). Owner ruling 2026-10-04:
 * suggested starting points, no sources, brands or badges on screen. FULLY
 * SILENT: the reed's swing and the hand chamber are shown, never played.
 *
 * Two source PATHS (the variants): a stand mic at the acoustic harmonica,
 * and a mic on the harp amp's speaker. The cupped harp mic is in the hands —
 * the amplified path starts there. The speaker itself is taught in full in
 * the Amplified speakers & Leslie module (SPK); this lesson links to it.
 */
import type { DiagnosticItem, Lesson, MikingScenario, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, CLEAR_REASON, cardioidNull, PLAYER_REASON, POWER_REASON, polarityKeepsDelay } from '../shared/metal/metalItems.ts';
import { metalWords } from '../shared/metal/metalCopy.ts';
import { firstNotch, gainCheck, hearingCheck, louderIsNotBetter, monoSymptom, moveRemovesDelay, quickHearing, setupOrder, type ReedWords } from '../shared/freereed/freeReedItems.ts';
import { A10_MODEL, A10_WEDGES, A10_ZONES } from './geometry.ts';

const W: ReedWords = { p: 'hm', the: 'the harmonica', player: 'player', loudest: 'the loudest phrase' };
/** The same words for the suspended-metal set's generic items. */
const MW = { ...W, tail: 'the end of the note' };

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the harmonica',
    goal: 'Get to know the harmonica — what it is, where you meet it, what it does in the music, its parts and the hands round it — and the harp amp it can play through, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'A small reed instrument, about 10 cm long: ten holes, twenty brass reeds, covers open at the back. The hands round it are part of its sound. Amplified, a harp mic is cupped with it and played through an amp.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how breath becomes sound — a reed swinging through its slot, chopping the air into puffs — and how the hands’ chamber shapes where it leaves. Shown, never played.',
    credit: { scenarios: ['hm.snd.1', 'hm.snd.2', 'hm.snd.3'], interactive: 'soundPath', note: 'Step the reed through to the end (or play it once), and answer the three checks.' },
    takeaway: 'Breath pushes a brass reed through its slot; it springs back and keeps swinging, letting the air through in puffs — the note. The sound leaves the back of the covers into the hands, and the hands’ chamber shapes it.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the harmonica sits — the player and their hands, the harp amp, a stage and a studio — the two signal paths to the desk, and what to do before any mic.',
    credit: { scenarios: ['hm.set.1', 'hm.set.hear', 'hm.set.2'], note: 'Answer the three checks.' },
    takeaway: 'Ask which harmonicas and which sound — clean acoustic, cupped harp mic through a PA, or the harp amp. Two separate paths reach the desk: a stand mic hears the acoustic instrument; a speaker mic hears the amplified system. Protect hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic by its properties — pattern, power, impedance, size and mount — for the path you want: a stand mic for the acoustic harmonica, a harp mic for the hands, a close mic for the amp.',
    credit: { scenarios: ['hm.mic.1', 'hm.mic.2', 'hm.mic.3', 'hm.mic.4', 'hm.rec.1'], note: 'Answer the five checks (one reaches back to how the harmonica sounds).' },
    takeaway: 'A directional stand mic helps isolate on a stage; an omni can suit a quiet room. A harp mic is an omni made to be cupped and to feed a high-impedance amp input. Check the real pattern, the impedance and the manual — not the connector.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — a stand mic about 15–30 cm from the harmonica at mouth and hand height, or a mic about 2.5–5 cm from the harp amp’s grille at the dust cap’s edge — then compare.',
    credit: { scenarios: ['hm.place.1', 'hm.place.2', 'hm.place.3', 'hm.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of the player and the amp, in two different recommended starting points (on either path), and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Acoustic: about 15–30 cm from the harmonica, just beyond the hands, facing the playing zone — a little off the breath stream if bursts dominate. Amp: on the real speaker, about 2.5–5 cm from the grille at the dust cap’s edge; toward the centre for bite, outward for a softer top.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the stand mic so its rejection faces a loud monitor — and know what the cupped harp mic and the amp change on a stage: no rear null, and no feedback at the mic’s top volume.',
    credit: { scenarios: ['hm.ctx.1', 'hm.ctx.2', 'hm.ctx.studio', 'hm.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the stand mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Live: a directional stand mic as close as the hands allow, its null toward the wedge; the cupped harp mic has no null — set the system so nothing rings even at its top volume. Studio: a stand mic first, then farther if the room is good.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'Add a farther mic to the close speaker mic on the harp amp: see the delay between them, what polarity does and does not change, and judge the blend in mono.',
    credit: { scenarios: ['hm.two.1', 'hm.two.2', 'hm.two.3', 'hm.two.4'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics hear the amp at different times. Polarity flips the sign; it does not remove a delay. Check each feed alone and the sum in mono — and remember a “clean” acoustic mic near the amp hears it too.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Placement, the hands and the path first: angle and distance, the grip and the hand opening, the mic’s knob and the amp, the real speaker, the cable and the input — before EQ. Feedback: lower the level first.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second feed.',
    credit: { scenarios: ['hm.prac.order', 'hm.prac.gain', 'hm.prac.setup1', 'hm.prac.setup2', 'hm.prac.3', 'hm.mix.1', 'hm.mix.2', 'hm.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Choose the path first — acoustic, cupped harp mic, or the amp’s speaker. Keep clear of the mouth and the hands, check the input the harp mic needs, start every level low, set no feedback at the top of the knob, and protect hearing.',
  },
};

/* THE CHECKS. Lesson refs (comments only): snd L6 · set L7, L28 · mic L26, L30, L34 · place L25, L36 ·
 * ctx L33, L34, L22 · two L37 · prac L28, L37, L65-L69. */
const scenarios: MikingScenario[] = [
  {
    id: 'hm.snd.1',
    page: 'sound',
    prompt: 'What actually makes the harmonica’s sound?',
    options: ['Reeds swinging through their slots, chopping the air', 'The breath itself, whistling through the small holes', 'The metal cover plates ringing like a little bell'],
    correct: 'Reeds swinging through their slots, chopping the air',
    explain: 'Breath is the power; brass reeds turn it into sound. Each reed swings through its slot, opening and closing the air’s way, so the air leaves in puffs at the reed’s frequency.',
    why: {
      'The breath itself, whistling through the small holes': 'The breath only drives the reeds. Without them, air through a hole makes a hiss, not a note.',
      'The metal cover plates ringing like a little bell': 'The covers protect the reeds and steer the sound out of the back; the reeds make it.',
    },
  },
  {
    id: 'hm.snd.2',
    page: 'sound',
    prompt: 'The player closes their cupped hands round the back of the harmonica. What changes?',
    options: ['The chamber the sound passes through, so the tone', 'Nothing at all: the reeds make the same sound', 'Only the volume, while the tone stays exactly as it was'],
    correct: 'The chamber the sound passes through, so the tone',
    explain: 'The sound leaves the back of the covers into the hands. Closing and opening that chamber changes the tone — the hand wah — which is why the hand position is part of the player’s sound.',
    why: {
      'Nothing at all: the reeds make the same sound': 'The reeds may not change, but the sound passes through the hands’ chamber on its way out.',
      'Only the volume, while the tone stays exactly as it was': 'The chamber shapes the tone, not only the level — compare at matched level to hear it.',
    },
  },
  {
    id: 'hm.snd.3',
    page: 'sound',
    prompt: 'A 10-hole harmonica has twenty reeds. Why two in each hole?',
    options: ['One sounds when you blow, the other when you draw', 'Two reeds make each note twice as loud as one', 'The second is a spare, used when the first breaks'],
    correct: 'One sounds when you blow, the other when you draw',
    explain: 'Each channel has a blow reed and a draw reed on opposite plates: the air’s direction decides which one is pushed into its slot and sounds.',
    why: {
      'Two reeds make each note twice as loud as one': 'They make two different notes: one on the blow, one on the draw.',
      'The second is a spare, used when the first breaks': 'Both work all the time — one for each direction of the air.',
    },
  },
  {
    id: 'hm.set.1',
    page: 'setting',
    prompt: 'Before placing a mic, what do you ask the harmonica player?',
    options: ['Which harmonicas, which sound, and how they hold it', 'Only the key of the first song, so you can set the EQ', 'Nothing yet: set the mic, then fit the playing round it'],
    correct: 'Which harmonicas, which sound, and how they hold it',
    explain: 'Clean acoustic, cupped harp mic through a PA, or the harp amp? Which harmonicas, whether they swap them, whether they sing too, and how the hands move — the sound and the clearance follow from that.',
    why: {
      'Only the key of the first song, so you can set the EQ': 'The key does not set a mic position; the target sound and the hands do. Establish the sound with the player before any EQ.',
      'Nothing yet: set the mic, then fit the playing round it': 'Never fit the player round a mic: place the mic for the player.',
    },
  },
  hearingCheck(W),
  {
    id: 'hm.set.2',
    page: 'setting',
    prompt: 'A singer also plays harmonica into the same vocal mic. How do you treat that?',
    options: ['As two sources: set the level for the louder, test both', 'As one source: set the gain on the singing alone', 'As the harmonica alone, since it is usually louder'],
    correct: 'As two sources: set the level for the louder, test both',
    explain: 'The voice and the harmonica sit at different distances and levels. Set gain and monitor level for the louder of the two at the real distances; if the balance or the feedback margin cannot be made stable, use separate mics or an agreed hand-off.',
    why: {
      'As one source: set the gain on the singing alone': 'The harmonica may be much louder or closer than the voice — the gain must suit both.',
      'As the harmonica alone, since it is usually louder': 'Test both at the real distances; either can be the louder one.',
    },
  },
  {
    id: 'hm.mic.1',
    page: 'microphone',
    prompt: 'A cupped harp mic is omni. Where can a floor wedge go to avoid feedback?',
    options: ['No null helps: distance, level and angle do the work', 'Directly behind the mic, where its rear null would sit', 'Off to its side, where a pickup pattern is weakest'],
    correct: 'No null helps: distance, level and angle do the work',
    explain: 'An omni picks up all round, so there is no rear null to aim. Place the wedge on an assumption of no rejection, keep levels down and keep the cupped mic away from loudspeakers.',
    why: {
      'Directly behind the mic, where its rear null would sit': 'That works for a cardioid. An omni harp mic has no rear null.',
      'Off to its side, where a pickup pattern is weakest': 'An omni hears its sides as well as its front.',
    },
  },
  {
    id: 'hm.mic.2',
    page: 'microphone',
    prompt: 'A directional vocal mic is cupped right over its grille. What happens?',
    options: ['Its rejection drops, so feedback comes sooner', 'It becomes a better harp mic, with no downside', 'It rejects the monitors more, being enclosed'],
    correct: 'Its rejection drops, so feedback comes sooner',
    explain: 'Covering the grille or rear ports of a directional mic alters its pattern and reduces its rejection. A dedicated harp mic is made to be cupped; a vocal mic is not.',
    why: {
      'It becomes a better harp mic, with no downside': 'Cupping changes the pattern and costs feedback margin.',
      'It rejects the monitors more, being enclosed': 'It is the other way round: covering the ports reduces the rejection.',
    },
  },
  {
    id: 'hm.mic.3',
    page: 'microphone',
    prompt: 'Your harp mic ends in an XLR plug. Can it go straight into a desk mic input?',
    options: ['Not until you check its impedance and the manual', 'Yes — if the plug fits, it means that it will work', 'Yes, and the phantom power will help it too'],
    correct: 'Not until you check its impedance and the manual',
    explain: 'Many harp mics are high-impedance, made for an amp input; a standard low-impedance mic input may need a matching transformer. A connector alone does not prove compatibility or phantom-power safety.',
    why: {
      'Yes — if the plug fits, it means that it will work': 'Connectors match more often than impedances do. Check the exact manual and input.',
      'Yes, and the phantom power will help it too': 'A dynamic harp mic needs no power, and phantom is not automatically safe for it — check the manual.',
    },
  },
  {
    id: 'hm.mic.4',
    page: 'microphone',
    prompt: 'A close directional stand mic makes the harmonica boomy. First thought?',
    options: ['Proximity effect: compare a little more distance', 'The harmonica is too low; cut the bass on the desk', 'The mic needs a windscreen to stop the boom'],
    correct: 'Proximity effect: compare a little more distance',
    explain: 'A directional mic very close to a source lifts the lows. Compare distance and angle before EQ — and do not assume an omni will fix room sound.',
    why: {
      'The harmonica is too low; cut the bass on the desk': 'Check the mic’s distance first — closeness can add that low end.',
      'The mic needs a windscreen to stop the boom': 'A windscreen helps with breath and pops; proximity effect comes from distance.',
    },
  },
  {
    id: 'hm.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does the harmonica’s sound leave it?',
    options: ['The back of the covers, into the hands', 'Back through the holes toward the mouth', 'The wooden comb’s sides, like a guitar body'],
    correct: 'The back of the covers, into the hands',
    explain: 'The reeds sound inside; the sound leaves the back of the cover plates and the ends — into the hands. That is where a stand mic should face, and where a harp mic is cupped.',
    why: {
      'Back through the holes toward the mouth': 'The lips cover the holes; the sound goes out the other way.',
      'The wooden comb’s sides, like a guitar body': 'The comb holds the channels; it is not a sounding body.',
    },
  },
  {
    id: 'hm.place.1',
    page: 'placement',
    prompt: 'A starting point says about 15–30 cm. Measured from where?',
    options: ['The harmonica, with the hands round it', 'The player’s chin, which stays still as they play', 'The floor, up to the mic’s own height'],
    correct: 'The harmonica, with the hands round it',
    explain: 'From the harmonica to the mic’s front — and the mic stays just beyond the hands’ whole movement, at about mouth and hand height.',
    why: {
      'The player’s chin, which stays still as they play': 'Measure from the source — the harmonica in the hands.',
      'The floor, up to the mic’s own height': 'Height is a separate setting; the distance is to the harmonica.',
    },
  },
  {
    id: 'hm.place.2',
    page: 'placement',
    prompt: 'Breath bursts and pops dominate at the stand mic. What do you try first?',
    options: ['Move it a little off the breath stream', 'Turn the gain up so the music covers them', 'Ask the player to blow more gently'],
    correct: 'Move it a little off the breath stream',
    explain: 'Aim slightly off the breath stream and compare over a whole phrase; a windscreen is an option to compare, not a reflex.',
    why: {
      'Turn the gain up so the music covers them': 'More gain raises the bursts too.',
      'Ask the player to blow more gently': 'The playing is the music; move the mic first.',
    },
  },
  {
    id: 'hm.place.3',
    page: 'placement',
    prompt: 'On the harp amp, the speaker mic sounds harsh. Where do you move it?',
    options: ['Toward the cone’s edge, keeping the distance', 'Right onto the grille, nearer the centre', 'Behind the amp, to hear the back of the cone'],
    correct: 'Toward the cone’s edge, keeping the distance',
    explain: 'Toward the centre tends to add bite; toward the edge, a softer top end. Slide outward one step at a time and check you are on the real speaker.',
    why: {
      'Right onto the grille, nearer the centre': 'Nearer the centre tends to add bite, and the mic stays off the grille.',
      'Behind the amp, to hear the back of the cone': 'That is a different, opposite-polarity view — and the vents need clear air. Try the edge first.',
    },
  },
  {
    id: 'hm.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · The hands open and close as the player plays. Must the stand clear that movement too?',
    options: ['Yes — the whole movement, over whole phrases', 'No — the hands stay round the harmonica', 'No, clearing the mouth is what really counts'],
    correct: 'Yes — the whole movement, over whole phrases',
    explain: 'The hands open and close and the instrument moves; the player may swap harmonicas. Watch whole phrases and keep the stand clear of the mouth, the hands and any neck holder.',
    why: {
      'No — the hands stay round the harmonica': 'They open and close — the hand wah — and the harmonica moves with the player.',
      'No, clearing the mouth is what really counts': 'The mouth AND the hands: a stand the hands can strike is in the way.',
    },
  },
  {
    id: 'hm.ctx.1',
    page: 'context',
    prompt: 'A cupped harp mic and a loud amp on stage. How do you set the levels?',
    options: ['No feedback even at the mic’s top volume setting', 'Turn it up until it starts to ring, then back off', 'Use a narrow EQ notch so it can go louder'],
    correct: 'No feedback even at the mic’s top volume setting',
    explain: 'Start every control low; walk the playing area with the amp and monitors at show level; set the system so nothing rings even at the highest knob position the player may use. A notch is not a substitute for safe geometry.',
    why: {
      'Turn it up until it starts to ring, then back off': 'Never create feedback on purpose: raise levels gradually and stop before ringing.',
      'Use a narrow EQ notch so it can go louder': 'A notch does not replace safe geometry or lower gain.',
    },
  },
  {
    id: 'hm.ctx.2',
    page: 'context',
    prompt: 'The acoustic stand mic also picks up the harp amp. What is that?',
    options: ['Spill: the amp reaches this mic as well', 'A fault: a stand mic hears only what it faces', 'Nothing to check: more harmonica is better'],
    correct: 'Spill: the amp reaches this mic as well',
    explain: 'Even a “clean” acoustic mic hears a nearby amp and the PA. Compare each feed alone and summed, and mute unused open mics.',
    why: {
      'A fault: a stand mic hears only what it faces': 'Every pattern hears off-axis sound too — less, not none.',
      'Nothing to check: more harmonica is better': 'The amp arrives later at the stand mic: summed, it can colour the tone. Check it.',
    },
  },
  {
    id: 'hm.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A quiet room, an acoustic harmonica. Where do you start?',
    options: ['A stand mic, then compare farther if the room is good', 'As close as possible, so the room drops right out', 'A cupped harp mic, for the most natural acoustic sound'],
    correct: 'A stand mic, then compare farther if the room is good',
    explain: 'In a quiet room, step farther back for a more integrated sound if the room permits; move closer for detail or isolation. A cupped harp mic is a different, amplified tone.',
    why: {
      'As close as possible, so the room drops right out': 'Close adds breath and detail; in a good room, some distance can sound more natural.',
      'A cupped harp mic, for the most natural acoustic sound': 'A cupped harp mic is a deliberate amplified tone, not the natural acoustic one.',
    },
  },
  {
    id: 'hm.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Is a cupped dedicated harp mic the same as a cupped vocal mic?',
    options: ['No — the harp mic is omni and made to be cupped', 'Yes — cupping changes both of them the same way', 'Yes, as long as both mics are dynamics'],
    correct: 'No — the harp mic is omni and made to be cupped',
    explain: 'A dedicated harp mic is an omni shaped for the hands; cupping is its intended use. Covering a directional vocal mic’s grille reduces its rejection and invites feedback.',
    why: {
      'Yes — cupping changes both of them the same way': 'A directional mic loses rejection when covered; an omni has none to lose.',
      'Yes, as long as both mics are dynamics': 'Being dynamic says nothing about the pattern or what cupping does to it.',
    },
  },
  polarityKeepsDelay(MW),
  firstNotch(W),
  {
    id: 'hm.two.3',
    page: 'twoMic',
    prompt: 'A close speaker mic and a mic 75 cm back on the amp. Why can the sum sound hollow?',
    options: ['The far mic hears the speaker later: a comb', 'The far mic hears the speaker in reverse polarity', 'Two mics on one amp cancel whatever you do'],
    correct: 'The far mic hears the speaker later: a comb',
    explain: 'The farther mic hears the same sound a couple of milliseconds later; summed, the delayed copy cancels at some frequencies. Solo each, sum in mono, then move or rebalance.',
    why: {
      'The far mic hears the speaker in reverse polarity': 'Both mics face the front of the cone: same polarity, different time.',
      'Two mics on one amp cancel whatever you do': 'Moving a mic or rebalancing changes the comb; it is not fixed.',
    },
  },
  louderIsNotBetter(W),
  gainCheck(W),
  {
    id: 'hm.prac.3',
    page: 'practice',
    prompt: 'What would justify a second harmonica feed — a room mic or a direct split?',
    options: ['A sound the first feed alone cannot give', 'Two feeds are the usual standard for harp', 'More level than one mic can give the PA'],
    correct: 'A sound the first feed alone cannot give',
    explain: 'Start with one speaker mic. Add a feed only for a defined reason, check each alone and combined in mono, and omit it if it hollows the tone. A direct split does not replace the speaker when its colour is central.',
    why: {
      'Two feeds are the usual standard for harp': 'One feed is the usual start; a second has to earn its place.',
      'More level than one mic can give the PA': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'hm.mix.1',
    page: 'practice',
    prompt: 'A player sings and plays harmonica into one mic; it rings on the harmonica. First move?',
    options: ['Lower the level, then set the gain for the louder source', 'Ask the player to hold the harmonica much farther from the mic', 'Open a second mic for the harmonica and leave both up'],
    correct: 'Lower the level, then set the gain for the louder source',
    explain: 'Reduce the level at once; then set gain and monitor level for the louder of the two positions. If it still cannot be stable, use separate mics or an agreed hand-off — and mute the unused one.',
    why: {
      'Ask the player to hold the harmonica much farther from the mic': 'The playing is the music. Fix the level and the geometry first.',
      'Open a second mic for the harmonica and leave both up': 'More open mics mean more spill and less gain before feedback.',
    },
  },
  cardioidNull(MW),
  moveRemovesDelay(W),
];

const symptoms: Symptom[] = [
  {
    id: 'hm.s.thin',
    observation: 'The acoustic tone is thin or breathy',
    firstChecks: 'Is the mic in the breath stream, or too far off the hands’ opening? Compare angle, distance and hand position over a whole phrase.',
    options: ['Angle, distance and the hand position, over a phrase', 'Boost the low end on the desk until the tone fills out', 'Swap to a different harmonica straight away'],
    correct: 'Angle, distance and the hand position, over a phrase',
    explain: 'The mic may sit in the breath stream or miss the hands’ opening. Compare angle, distance and hand position over a full phrase before EQ.',
    why: {
      'Boost the low end on the desk until the tone fills out': 'Find the placement cause first; EQ cannot put the mic in the right place.',
      'Swap to a different harmonica straight away': 'The instrument is the player’s choice; check the mic and the hands first.',
    },
  },
  {
    id: 'hm.s.wah',
    observation: 'The hand wah disappears',
    firstChecks: 'Is a fixed stand mic too far from the moving hands, or is the player using a neck holder? Recheck the playing motion with the player.',
    options: ['Mic too far from the hands, or a neck holder?', 'Add a compressor so that the wah comes back up', 'Turn the gain up until the wah returns'],
    correct: 'Mic too far from the hands, or a neck holder?',
    explain: 'A neck holder limits cupped-hand technique; a distant fixed mic may miss the moving hands. Recheck the motion and choose a position or approach with the player.',
    why: {
      'Add a compressor so that the wah comes back up': 'A compressor cannot restore what the mic is not hearing.',
      'Turn the gain up until the wah returns': 'More gain raises everything, including spill; the cause is position or technique.',
    },
  },
  {
    id: 'hm.s.nasal',
    observation: 'The harp-mic tone turns nasal or dull',
    firstChecks: 'Did the grip, the hand opening, the mic’s knob or the amp setting change? Compare each factor at matched loudness.',
    options: ['Grip, hand opening, the mic’s knob or the amp', 'The amp’s speaker is failing; replace it now', 'Cut the mids on the desk until it clears'],
    correct: 'Grip, hand opening, the mic’s knob or the amp',
    explain: 'The hands, the mic, the amp and its speaker are all part of the amplified sound. Compare each factor at a sensible matched loudness.',
    why: {
      'The amp’s speaker is failing; replace it now': 'Check what changed first — usually the grip or a control.',
      'Cut the mids on the desk until it clears': 'Find which part of the chain changed before EQ.',
    },
  },
  {
    id: 'hm.s.feedback',
    observation: 'Early feedback',
    firstChecks: 'Is the hand-held mic near an amp, a wedge or the PA — or a directional vocal grille covered? Reduce the level at once; move the speaker or the mic; close unused mics; retest gradually.',
    options: ['Lower the level; move speaker or mic; retest', 'Cup the vocal mic tighter to block the sound', 'Push on: it settles once the song gets going'],
    correct: 'Lower the level; move speaker or mic; retest',
    explain: 'Reduce the level immediately, then fix the geometry: move the speaker or the mic, close unused mics, and bring levels up gradually.',
    why: {
      'Cup the vocal mic tighter to block the sound': 'Covering a directional vocal mic reduces its rejection — feedback comes sooner.',
      'Push on: it settles once the song gets going': 'Ringing grows; lower the level at once.',
    },
  },
  {
    id: 'hm.s.harsh',
    observation: 'The speaker mic sounds harsh',
    firstChecks: 'Is it too near the dust cap’s centre? Slide toward the cone’s edge; verify the real speaker and compare.',
    options: ['Slide toward the cone’s edge; check the speaker', 'Turn the amp’s own treble control right down low', 'Move the mic right up against the grille'],
    correct: 'Slide toward the cone’s edge; check the speaker',
    explain: 'Toward the centre tends to add bite. Slide outward, keeping the distance, and confirm the mic is on the speaker that is really sounding.',
    why: {
      'Turn the amp’s own treble control right down low': 'The amp’s settings are the player’s tone; move the mic first.',
      'Move the mic right up against the grille': 'Closer usually adds bite and low end; keep it off the grille.',
    },
  },
  {
    id: 'hm.s.hum',
    observation: 'Hum or an intermittent signal',
    firstChecks: 'Are the cable, the connector, the input impedance and the amp’s power sound? Stop and check the maker’s wiring; a qualified technician for electrical faults.',
    options: ['Stop; check cable, connector, input and power', 'Wiggle the cable during the show until the hum stops', 'Add a noise gate so the hum hides between the notes'],
    correct: 'Stop; check cable, connector, input and power',
    explain: 'Check the cable, the connector, the input it is plugged into and the amp’s power; leave electrical faults to a qualified technician.',
    why: {
      'Wiggle the cable during the show until the hum stops': 'An intermittent connection is a fault to stop and fix, not to nurse through a show.',
      'Add a noise gate so the hum hides between the notes': 'A gate hides the symptom; the fault remains.',
    },
  },
  monoSymptom(W),
];

const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured from the harmonica', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const HANDS_REASON: SetupReason = { id: 'r.hands', label: 'The hand wah and the breath are heard, not the bursts', role: 'optional', feedback: 'A fair reason for a stand mic just beyond the hands, a little off the breath stream.' };
const SPEAKER_REASON: SetupReason = { id: 'r.spk', label: 'It is on the real speaker, measured from the grille', role: 'required', feedback: 'Find the speaker behind the cloth; the cabinet’s middle is not always the speaker’s.' };
const FEEDBACK_REASON: SetupReason = { id: 'r.fb', label: 'The amp does not point at the cupped harp mic', role: 'optional', feedback: 'A fair live reason: the omni harp mic has no null to protect it.' };

const setupTasks: SetupTask[] = [
  {
    id: 'hm.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A quiet studio: an acoustic harmonica solo with hand wah, in a room that sounds good. Phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser about 20 cm in front of the hands, at mouth height', ok: true, power: 'phantom', feedback: 'The recommended start, just beyond the hands; it needs the phantom this channel has.' },
      { id: 'b', label: 'Small dynamic about 25 cm away, a little off the breath stream', ok: true, power: 'none', feedback: 'Also a fair start: off the breath stream, still facing the hands.' },
      { id: 'c', label: 'A stand mic 3 cm from the lips, right in the breath', ok: false, power: 'none', feedback: 'Inside the hands’ movement and in the breath stream — and near the face.' },
      { id: 'd', label: 'A vocal mic cupped in the hands, its grille covered', ok: false, power: 'none', feedback: 'A covered directional grille loses its pattern; and it is not the acoustic sound asked for.' },
      { id: 'e', label: 'Only a mic on the harp amp’s speaker', ok: false, power: 'none', feedback: 'That is the amplified path, not the acoustic harmonica the brief asks for.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, HANDS_REASON, BRAND_REASON, PLAYER_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a starting point from the harmonica, just beyond the hands, with the power the mic needs.',
  },
  {
    id: 'hm.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud blues show: the player cups a harp mic into their own amp; the PA needs the amp’s sound. The spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Small dynamic 2.5–5 cm from the grille, at the dust cap’s edge', ok: true, power: 'none', feedback: 'On the real speaker, at a dependable first spot; a dynamic needs no phantom.' },
      { id: 'b', label: 'Small dynamic at the same distance, a little toward the cone’s edge', ok: true, power: 'none', feedback: 'A softer top end; fair if the player’s tone is bright.' },
      { id: 'c', label: 'The amp’s speaker output patched into the desk', ok: false, power: 'none', feedback: 'Never: a speaker output goes to a speaker only. Mic the speaker.' },
      { id: 'd', label: 'Small condenser in front of the speaker', ok: false, power: 'phantom', feedback: 'This input has no phantom, and a condenser needs it.' },
      { id: 'e', label: 'The harp mic straight into a desk mic input, no checks', ok: false, power: 'none', feedback: 'A high-impedance harp mic may need a matching transformer — check first. And the brief asks for the amp’s sound.' },
    ],
    reasons: [SPEAKER_REASON, POWER_REASON, { id: 'r.clr', label: 'The mic is off the grille, the cable out of walkways', role: 'required', feedback: 'Clear of the grille and the moving cone; cables out of the way.' }, FEEDBACK_REASON, BRAND_REASON, PLAYER_REASON],
    explain: 'Two setups pass. What passes is the reasoning: the real speaker, a starting point measured from the grille, powered by what this input can supply — and an amp that does not point at the cupped mic.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what turns the breath into a note?', options: ['Reeds chopping the air', 'The breath whistling', 'The covers ringing'], after: 'Now STEP through the reed (or PLAY ONCE), then try its shapes and the hands’ chamber.' },
  microphone: { prompt: 'Before you move anything: a harp mic is omni. Where does it pick up LEAST?', options: ['Nowhere: much the same all round', 'Straight behind it', 'At its sides'], after: 'Sweep SOURCE ANGLE round a cardioid, then choose the harp mic’s TYPE and sweep again.' },
  placement: { prompt: 'Predict: you move the stand mic from 15 cm back to 30 cm. What changes most?', options: ['More room, less breath and detail', 'More breath', 'Nothing'], after: 'Rest the mic in two zones — switch PATH to try the amp — and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge sits downstage, behind the stand mic. Can a cardioid’s null reach it?', options: ['Yes — its back can face the wedge', 'No — only an omni can', 'It is already at the side'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION. Then pick the harp amp as the MONITOR.' },
  twoMic: { prompt: 'A close speaker mic and one 75 cm back. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'hm.q.1',
    covers: 'instrument',
    prompt: 'Where does the harmonica’s sound leave it?',
    options: ['Out the back of the covers, into the hands', 'Back through the holes toward the mouth', 'Out of the wooden comb, like a guitar body'],
    correct: 'Out the back of the covers, into the hands',
    explain: 'The reeds sound inside; the sound leaves the back of the cover plates and the ends, into the player’s hands.',
    why: {
      'Back through the holes toward the mouth': 'The lips cover the holes; the sound leaves the other way.',
      'Out of the wooden comb, like a guitar body': 'The comb holds the channels; it is not a sounding body.',
    },
  },
  {
    id: 'hm.q.2',
    covers: 'instrument',
    prompt: 'Why note how the player holds the harmonica?',
    options: ['The hand chamber is part of the sound', 'It decides which key the harmonica plays in', 'It shows you which reeds are worn'],
    correct: 'The hand chamber is part of the sound',
    explain: 'The hands make a chamber the sound passes through; opening and closing it is part of the player’s tone. Record the hand position you compared.',
    why: {
      'It decides which key the harmonica plays in': 'The key is the harmonica’s; the player swaps harmonicas to change it.',
      'It shows you which reeds are worn': 'The grip says nothing about the reeds; it shapes the tone.',
    },
  },
  {
    id: 'hm.q.3',
    covers: 'sound',
    prompt: 'What does a harmonica reed do to the air?',
    options: ['Chops it into puffs as it swings through its slot', 'Warms it so that it rings like a short pipe', 'Stores it, then lets it out in one long blast'],
    correct: 'Chops it into puffs as it swings through its slot',
    explain: 'The reed swings through its slot, opening and closing the air’s way, so the air leaves in puffs at the reed’s frequency — the note.',
    why: {
      'Warms it so that it rings like a short pipe': 'The comb’s channel is not a tuned pipe here; the reed sets the pitch.',
      'Stores it, then lets it out in one long blast': 'The flow is cut and opened again and again, not released once.',
    },
  },
  {
    id: 'hm.q.4',
    covers: 'sound',
    prompt: 'A reed’s higher shapes sit far above its note. Where does its rich tone mostly come from?',
    options: ['The puffs of air the reed lets through', 'Those higher shapes, all ringing out loudly', 'The covers, ringing at the same pitch'],
    correct: 'The puffs of air the reed lets through',
    explain: 'The reed swings mostly in its lowest shape; the sudden opening and closing of the air’s way makes the many harmonics.',
    why: {
      'Those higher shapes, all ringing out loudly': 'They sit far above the note and are not a neat series; the puffs carry the harmonics.',
      'The covers, ringing at the same pitch': 'The covers steer the sound; they do not make the note.',
    },
  },
  {
    id: 'hm.q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Placing a stand mic for a harmonica player, what comes before any distance?',
    options: ['Clear of the mouth, the hands and any neck holder', 'The exact 15–30 cm the starting point gives you', 'The shortest cable run back to the stage box itself'],
    correct: 'Clear of the mouth, the hands and any neck holder',
    explain: 'A stand that can strike the mouth, the instrument or a neck holder is never acceptable. Watch whole phrases; the distances are starting points.',
    why: {
      'The exact 15–30 cm the starting point gives you': 'The numbers are starting points; the player’s safety and movement come first.',
      'The shortest cable run back to the stage box itself': 'A tidy cable matters, but never before the mouth and the hands.',
    },
  },
  quickHearing(W),
];

export const A10_LESSON: Lesson = {
  id: 'A10',
  labId: 'winds',
  title: 'Harmonica',
  subtitle: 'Acoustic on a stand, cupped through an amp, or the amp’s speaker — three paths',
  noun: { one: 'harmonica', many: 'harmonicas' },
  model: A10_MODEL,
  micTypeIds: ['smallDynCard', 'sdcCard', 'harpBullet'],
  zones: A10_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks: [setupOrder(W, { text: 'Choose the path with the player: acoustic, cupped harp mic, or the amp', early: 'Start with the player and the sound they want.' })],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A small reed instrument: ten holes and, behind them, twenty brass reeds — in each hole one sounds when you blow and one when you draw. The lips cover the holes; the hands hold it and shape its sound.', src: 'HOH-ROCKET' },
    { title: 'WHERE YOU MEET IT', text: 'Blues, folk, rock, country and pop — on stage and in the studio, often played by a singer or a guitarist, sometimes from a neck holder. Played acoustically, or cupped round a harp mic through an amplifier.', src: 'LESSON-HM' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Melody, answering phrases and fills, rhythmic chords; through a harp amp, a driven, gritty lead voice. The player changes harmonicas to change key.', src: 'LESSON-HM' },
    { title: 'ITS SIZE', text: 'About 10 cm (4 in) long — small enough to disappear in the hands. That is why the hands matter so much to its sound.', src: 'HOH-SP20' },
  ],
  sound: {
    stages: [
      { title: 'The air arrives', text: 'The player blows or draws through one hole. The air reaches the two reeds in that hole’s channel; the reed the air presses into its slot is the one that will sound.' },
      { title: 'Through the slot', text: 'The air pushes the reed down through its slot. As the reed clears the plate, the air’s way opens: a puff of air passes.' },
      { title: 'Springing back', text: 'The reed is springy brass: it swings back up through the slot — closing it as it passes — and on past it, and the way opens again.' },
      { title: 'Puffs are the note', text: 'It keeps swinging at its own frequency, chopping the air into puffs — that is the note. The sound leaves the back of the cover plates and the ends, into the player’s hands.' },
    ],
    attack: 'The note’s start: the reed takes a moment to swing up to full size, and the breath and the tongue shape that start — breathy or crisp. A mic in the breath stream hears more of the air and the pops.',
    body: 'The sustained tone, shaped by the hands’ chamber — open, cupped or moving (the hand wah). A stand mic hears that shaping and the air round it; a harp mic in the hands is part of the chamber, and through an amp the tone also takes on the amp and its speaker. Tendencies — players, harmonicas and amps vary.',
    head: { diameterMm: 102, rods: 0, label: 'a 10-hole harmonica', strikeSrc: 'HOH-SP20' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player, the harmonica and the hands', short: 'PLAYER', note: 'Standing, the harmonica at the lips, the hands round it. Their face, hands and any neck holder come before any mic; they may swap harmonicas and need somewhere to put a hand-held mic down.', prov: { kind: 'illustrative', reason: 'a standing player: a drawing default' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'amp', label: 'the harp amp', short: 'HARP AMP', note: 'Behind and to the side of the player, so they hear it without it pointing at the cupped mic. A mic on its speaker hears the whole amplified system: the harp mic, the amp, its distortion and the speaker.', prov: { kind: 'illustrative', reason: 'the amp behind the player, off their axis: a drawing default' }, tag: 'A SOURCE · FEEDBACK', scene: 'all' },
      { id: 'wedge', label: 'a floor wedge downstage', short: 'WEDGE', note: 'Live, a floor monitor in front of the player, facing back at them — behind a stand mic that faces the harmonica, where a pattern’s null can help. The omni harp mic has no null.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the band', short: 'BAND', note: 'Loud neighbours: a closer directional stand mic helps more than gain; the amp and its speaker mic carry the harp in a loud band.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE · PA', note: 'The PA faces the audience. Keep the cupped mic away from, and never pointed into, the PA or the amp.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet room that sounds good, a stand mic can step back for a more integrated sound.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: choose the path with the player. A stand mic as close as the hands allow, its null toward the wedge; a cupped harp mic through the amp, with no feedback even at its top volume; a speaker mic on the amp for the PA only as much as needed.',
    studio: 'STUDIO: a stand mic just beyond the hands first; step back if the room is good. For the amplified sound, mic the amp’s real speaker. Compare each path alone, at matched level.',
  },
  diagnostic,
  practice: {
    task: 'Choose the path, keep the mouth and the hands clear, check the input the harp mic needs, start every level low, set no feedback at the top of the knob, and judge any second feed in mono. With the player’s agreement, log what you tried below.',
    fields: [
      { id: 'inst', label: 'Harmonica(s) and key(s); any neck holder', kind: 'text' },
      { id: 'path', label: 'Which path', kind: 'choice', choices: ['acoustic stand mic', 'cupped harp mic and amp', 'speaker mic on the amp'] },
      { id: 'mic', label: 'Mic, pattern and the input it went to', kind: 'text' },
      { id: 'zone', label: 'Distance and angle (from the harmonica, or the grille)', kind: 'text' },
      { id: 'clear', label: 'Clearance from the mouth and the hands; feedback check', kind: 'text' },
      { id: 'notes', label: 'What you heard: breath, hand wah, amp tone (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The harmonica’s height (26 mm) and depth (28 mm), the comb (10 mm) and plates (1.2 mm) — drawing defaults; only its length (102 mm), 10 holes and 20 reeds are published.', dims: ['height', 'depth', 'combH', 'plateT'] },
    { text: 'The player: mouth 1550 mm above the floor, standing 1.35 m in front of the amp and 0.75 m to its side; the hands’ envelope 140 × 120 × 120 mm; the breath stream drawn as a 20° cone, 200 mm long — drawing defaults.', dims: ['mouthH', 'handsX', 'handsY', 'handsZ', 'breathHalf', 'breathLen', 'x', 'z', 'wedgeX'] },
    { text: 'The amp is the speaker family’s guitar-type combo, drawn standing on the floor; its starting points are the speaker module’s, measured from the grille cloth (a guitar-amp source, re-based for the harp amp: CORRECTIONS_LOG HM-01).', dims: ['yFloor'] },
    { text: 'The acoustic 15–30 cm is the lesson’s own practical trial, not a published harmonica standard; “a little off the breath stream” is drawn 20–40° off the line straight out.', dims: [] },
    { text: 'A second dedicated harp mic’s manual could not be read; only the first’s published size (Ø 63 × 82.6 mm) is drawn.', dims: [] },
  ],
  live: { wedges: A10_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. No maker publishes a universal stand distance for an acoustic harmonica: the 15–30 cm is a practical starting experiment. The amp’s starting points come from amplifier-speaker practice, measured from the grille cloth. Every player, harmonica, harp mic, amp and room is different: move the mic, compare at matched level, and trust your ears. The lab is silent and draws a simplified picture: one reed’s swing (motion drawn larger), an ideal reed’s shapes, the hands’ chamber as drawings, mic patterns as textbook shapes. Distances are rounded to about 5 mm. Keep clear of the mouth and the hands, check the input the harp mic needs, and never provoke feedback.',
  copy: { words: metalWords('harmonica', 'player') },
};
