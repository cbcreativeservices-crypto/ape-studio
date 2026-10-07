/**
 * A02 TROMBONE AND BASS TROMBONE — the lesson's pages as DATA (blueprint
 * §7). The words come from the owner's lessons (docs/labs/miking/
 * source_text/Trombone-Miking-Technique-Research.txt and Bass-Trombone-…,
 * cited "L<n>" in COMMENTS only) with the fixes logged in docs/labs/miking/
 * CORRECTIONS_LOG.md (A2-01 … A2-07) applied — among them the softened
 * vibration line (bass L25: clip- or holder-mounted mics on an instrument
 * can pick up vibration), the practice guide's 2–4 ft (ADD) and the slide's
 * DERIVED positions shown as approximate.
 *
 * One lesson with the instrument as its variant (TROMBONE: TENOR / BASS),
 * as the research groups them (Batch 3 §4: brass I). The slide is the
 * lesson's core safety idea (L8, L45): its path to 7th is a keep-out with a
 * buffer, and a mic straight in front of the bell is stopped by it.
 * OWNER RULING 2026-10-04 — suggested starting points, never dogma; no
 * source, brand or model in learner text; no badges.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, LessonPages, PageContent, SourcePageId, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { BRAND_REASON, LOUD_REASON, clearReason, docReason, gainCheck, hearingCheck, hearingDiag, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, type Words } from '../shared/bowed/bowedItems.ts';
import { brassFeedback, CLIP_POWER_REASON, DYN_POWER_REASON, overloadCheck } from '../shared/brass/brassItems.ts';
import { A02_MODEL, TB } from './geometry.ts';
import { A02_ZONES } from './model.ts';
import { A02_COPY } from './copy.ts';

const W: Words = { noun: 'trombone', player: 'trombonist', moving: 'the slide, the hands and the mutes' };

const pages: LessonPages = {
  instrument: {
    title: 'Meet the trombone',
    goal: 'Get to know the tenor and the bass trombone — what they are, where you meet them, what they do in the music, and their parts — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The lips buzz in the mouthpiece, the slide makes the tube longer, and the bell sends the sound out. The bass trombone has the same tube length, a wider bore, a larger bell and valves for the lowest notes.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how buzzing lips become a note — the air column, the slide, the bell — and where the sound goes: nearly all round low down, beamed ahead up high. Shown, never played.',
    credit: { scenarios: ['tb.snd.1', 'tb.snd.2', 'tb.snd.3'], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
    takeaway: 'The lips buzz, the tube’s standing wave sets the note, the slide lengthens the tube, and the bell lets the sound out: the lows spread round, the highs beam along the axis. The slide’s path is the trombone’s big keep-out.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know where the trombone sits — the player, the slide’s reach to 7th position, the hands, the mutes and the neighbours — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['tb.set.1', 'tb.set.2', 'tb.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The slide reaches straight out past the bell — about 56 cm farther at 7th position — with the arm behind it. No mic, stand, boom or cable goes there. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the trombone by its properties — pattern, power, the level it can take, and its mount — not by its brand.',
    credit: { scenarios: ['tb.mic.1', 'tb.mic.2', 'tb.mic.3', 'tb.mic.4', 'tb.rec.1'], note: 'Answer the five checks (one reaches back to how the trombone sounds).' },
    takeaway: 'Pattern, power, the level the mic can take and its mount decide what it can do here. A stand mic beside the slide’s path gives the horn and some room; a bell clip — never on the slide — keeps one distance. Check the mic can take the peaks.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — above or beside the slide’s path, aimed across the bell — then move the mic and see what changes, and why straight in front is stopped.',
    credit: { scenarios: ['tb.place.1', 'tb.place.2', 'tb.place.3', 'tb.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from the bell rim’s centre — not a rule. The slide’s whole path comes first: a mic straight in front of the bell looks reasonable, but its stand drops through the slide.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do, and why a horn on a loud stage and an overdub in a good room need different choices.',
    credit: { scenarios: ['tb.ctx.1', 'tb.ctx.2', 'tb.ctx.studio', 'tb.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid off to each side of the rear. Real nulls are shallower than the picture, and no mic position alone prevents feedback. Live, a closer mic or a bell clip; in the studio, a safe main mic and maybe a view about 3 m away.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why a close mic and a farther mic on one trombone can sound thin together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['tb.two.1', 'tb.two.2', 'tb.two.3', 'tb.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics at different distances hear the horn at different times: some pitches cancel in the sum — listen to the lowest notes. Move or rebalance first; polarity flips the sign and never removes a delay. Judge the pair in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — the slide’s clearance, the angle to the bell, overload in the mic itself, a filter on the lowest notes, a mute, the combination — before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one trombone mic in the right order, choose and justify a setup for a studio overdub and a loud stage, and say what would justify a second mic.',
    credit: { scenarios: ['tb.prac.order', 'tb.prac.gain', 'tb.prac.setup1', 'tb.prac.setup2', 'tb.prac.3', 'tb.mix.1', 'tb.mix.2', 'tb.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real horn.' },
    takeaway: 'The slide’s whole path kept clear, headroom for the loudest accent, the lowest notes kept, pattern reasoning and an accurate account of polarity versus delay pass. A brand or a “loudest” position do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Lesson lines in comments only (tenor T, bass B): tb.snd.*
 * trombone/SOURCES.md §b (PL-2010, UNSW) · tb.set.* T L6, T L8, T L45, B L9 ·
 * tb.mic.* T L11, T L21, B L7 · tb.place.* T L7, T L11, T L21 · tb.ctx.* T
 * L17, T L26, B L26 · tb.two.* T L17, T L19 · tb.prac.* / tb.mix.* T L55,
 * B L11, B L36.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'tb.snd.1',
    page: 'sound',
    prompt: 'The player moves the slide from 1st to 4th position. What happens?',
    options: ['The tube gets longer, so the note falls', 'The tube gets shorter, so the note rises', 'The bell moves, so the sound’s direction changes'],
    correct: 'The tube gets longer, so the note falls',
    explain: 'Moving the slide out adds tube on both legs: a longer air column plays lower — about a semitone per position. The bell stays where it is; the crook, the hand and the arm travel.',
    why: {
      'The tube gets shorter, so the note rises': 'Out is longer, not shorter: the slide adds tube as it extends.',
      'The bell moves, so the sound’s direction changes': 'The bell section stays put; only the slide and the arm move.',
    },
  },
  {
    id: 'tb.snd.2',
    page: 'sound',
    prompt: 'Compared with a trumpet, how does a trombone spread its low notes?',
    options: ['More evenly all round, even behind the player', 'Only forward, in a narrow beam from the bell', 'Mostly down along the slide toward the floor'],
    correct: 'More evenly all round, even behind the player',
    explain: 'A trombone’s lows spread out nearly evenly in every direction — more so than a trumpet’s. So every open mic on a stage hears them; from about 1 kHz up, the bell beams the sound forward.',
    why: {
      'Only forward, in a narrow beam from the bell': 'That is the highs. The lows spread round.',
      'Mostly down along the slide toward the floor': 'The sound leaves the bell, not the slide; the lows spread all round it.',
    },
  },
  {
    id: 'tb.snd.3',
    page: 'sound',
    prompt: 'The bass trombone has the same tube length as the tenor. What helps it reach lower notes?',
    options: ['Valves that add loops of tubing', 'A slide that is twice as long', 'A smaller bell and a narrower bore'],
    correct: 'Valves that add loops of tubing',
    explain: 'Its valves — often an F and a G♭ — bring in extra tubing for the lowest notes, worked by the left thumb. Its bore is wider and its bell larger, too. Configurations vary: ask the player.',
    why: {
      'A slide that is twice as long': 'The slide is the same reach; the extra length comes from the valves’ loops.',
      'A smaller bell and a narrower bore': 'It is the other way round: a wider bore and a larger bell.',
    },
  },
  hearingCheck('tb.set.1', W),
  {
    id: 'tb.set.2',
    page: 'setting',
    prompt: 'A mic stand a little in front of the bell looks clear of the trombone at rest. What next?',
    options: ['Check the slide’s full reach with the player', 'Nothing: the bell is what the stand must clear', 'Nothing, as long as it is 30 cm from the bell'],
    correct: 'Check the slide’s full reach with the player',
    explain: 'At rest the slide is closed. Out at 7th it reaches about 56 cm farther, with the hand and arm. Have the player show the passage’s full reach, then put the stand, boom and cable outside it with a buffer.',
    why: {
      'Nothing: the bell is what the stand must clear': 'The slide reaches past the bell; it is the moving part to clear.',
      'Nothing, as long as it is 30 cm from the bell': 'No bell-to-mic number is a slide clearance. Watch the real reach.',
    },
  },
  {
    id: 'tb.set.3',
    page: 'setting',
    prompt: 'Before placing any mic, what do you map with the trombonist?',
    options: ['The slide’s reach, the posture, valves and mutes', 'Only the bell’s height, so the stand can be set to it', 'The make of the trombone, for the mic choice'],
    correct: 'The slide’s reach, the posture, valves and mutes',
    explain: 'With the player: the greatest slide reach the passage needs, standing or seated, the instrument’s tilt, valve use and every mute. Then the stand and cable go outside all of it.',
    why: {
      'Only the bell’s height, so the stand can be set to it': 'The bell’s height is one thing; the slide’s path is the main keep-out.',
      'The make of the trombone, for the mic choice': 'The make does not place the mic. The movement and the music do.',
    },
  },
  {
    id: 'tb.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Where does most of a trombone’s high-frequency sound go?',
    options: ['Forward, along the bell’s axis', 'Evenly all round the bell', 'Back over the player’s shoulder'],
    correct: 'Forward, along the bell’s axis',
    explain: 'From about 1 kHz up the bell beams the sound forward. A mic toward the axis hears more bite; off it, a softer top.',
    why: {
      'Evenly all round the bell': 'That is the lows. The highs beam forward.',
      'Back over the player’s shoulder': 'The bell section goes over the shoulder, but the bell points forward.',
    },
  },
  overloadCheck('tb.mic.1', 'trombone'),
  {
    id: 'tb.mic.2',
    page: 'microphone',
    prompt: 'Where may a miniature clip be mounted on a trombone?',
    options: ['On the bell rim, where its maker allows', 'On the outer slide, close to the crook end', 'On the valve linkage, near the thumb'],
    correct: 'On the bell rim, where its maker allows',
    explain: 'Only on the stationary bell, with a clip made for it and the player’s agreement — never on the slide or the valve linkage. Route the cable clear of the slide and the hands.',
    why: {
      'On the outer slide, close to the crook end': 'The slide moves and is precision tubing: nothing is mounted on it.',
      'On the valve linkage, near the thumb': 'The linkage must move freely, and the thumb works there.',
    },
  },
  {
    id: 'tb.mic.3',
    page: 'microphone',
    prompt: 'Your only spare input has no phantom power. Which of this page’s mics will work?',
    options: ['The dynamic: it needs no power', 'The bell clip, since it is so small', 'The condenser, if its cable is short'],
    correct: 'The dynamic: it needs no power',
    explain: 'A dynamic makes its own signal. Both condensers — the stand mic and the bell clip — need phantom power (the miniature through its adapter).',
    why: {
      'The bell clip, since it is so small': 'Size does not power a condenser. The miniature still needs phantom power through its adapter.',
      'The condenser, if its cable is short': 'Cable length does not power a condenser.',
    },
  },
  {
    id: 'tb.mic.4',
    page: 'microphone',
    prompt: 'A bass trombone part goes very low. How do you set the high-pass filter?',
    options: ['Start unfiltered; add only what the lowest note allows', 'Set it to the bass trombone’s standard lowest note', 'Cut everything below 120 Hz to keep the low end clean'],
    correct: 'Start unfiltered; add only what the lowest note allows',
    explain: 'The part and the horn’s valves set the lowest note — there is no standard figure. Start unfiltered, add only what rumble or handling needs, then check the lowest wanted note keeps its weight.',
    why: {
      'Set it to the bass trombone’s standard lowest note': 'There is no standard: valve setups and parts differ. Check the actual part.',
      'Cut everything below 120 Hz to keep the low end clean': 'That can remove the fundamentals of the lowest notes — the bass line itself.',
    },
  },
  {
    id: 'tb.place.1',
    page: 'placement',
    prompt: 'You try a mic straight in front of the bell, 40 cm out. The lab stops it. Why?',
    options: ['Its stand drops through the slide’s path', 'It is too close to the bell for the mic', 'It is too far away for a trombone spot mic'],
    correct: 'Its stand drops through the slide’s path',
    explain: 'The slide reaches past the bell and out to 7th position below it. A mic in front looks fine, but its stand and boom cross the slide’s path. Go above the slide or out to the bell’s side.',
    why: {
      'It is too close to the bell for the mic': '40 cm is inside the recommended range; it is the stand that collides.',
      'It is too far away for a trombone spot mic': 'Distance is not the problem here — the slide’s path is.',
    },
  },
  {
    id: 'tb.place.2',
    page: 'placement',
    prompt: 'You swing the mic toward the bell’s centre line, same distance. What tends to change?',
    options: ['More edge and definition', 'A softer, rounder top', 'Only the level, not the tone'],
    correct: 'More edge and definition',
    explain: 'Toward the axis the mic hears more of the high beam: more bite and definition — and more risk of glare. Recheck the slide’s clearance after every move.',
    why: {
      'A softer, rounder top': 'That is what moving AWAY from the axis tends to do.',
      'Only the level, not the tone': 'The angle changes the balance of highs to lows, not just the level.',
    },
  },
  {
    id: 'tb.place.3',
    page: 'placement',
    prompt: 'A starting point says “30–60 cm from the bell”. What is that measured from?',
    options: ['The centre of the bell’s rim', 'The end of the slide’s crook', 'The player’s mouth, at the cup'],
    correct: 'The centre of the bell’s rim',
    explain: 'The sound leaves at the bell, so distances start at the rim’s centre. The slide’s crook moves — it is something to clear, not something to measure from.',
    why: {
      'The end of the slide’s crook': 'The crook moves with every position; it is a keep-out, not a reference.',
      'The player’s mouth, at the cup': 'The cup is where the sound starts; it leaves at the bell.',
    },
  },
  {
    id: 'tb.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · How far does the slide reach past 1st position at 7th?',
    options: ['About half a metre farther out', 'A few centimetres at most', 'It does not move past the bell'],
    correct: 'About half a metre farther out',
    explain: 'Seven positions, each about a semitone: the slide travels a little over half a metre from 1st to 7th, with the hand and arm. Watch the real player’s reach — positions are found by ear.',
    why: {
      'A few centimetres at most': 'Each position is several centimetres; seven of them add up to over half a metre.',
      'It does not move past the bell': 'Even closed, the slide reaches past the bell — and farther as it extends.',
    },
  },
  {
    id: 'tb.ctx.1',
    page: 'context',
    prompt: 'A trombone solo on a loud stage. A good first step for the mic?',
    options: ['A closer mic or bell clip, pattern aimed', 'A farther mic for a natural band blend', 'Turn the channel up until it cuts through'],
    correct: 'A closer mic or bell clip, pattern aimed',
    explain: 'On a loud stage, closer pickup — outside the slide’s path — or a bell clip gives more horn relative to the band; aim the rejection at the wedge. More gain raises the band in that channel too.',
    why: {
      'A farther mic for a natural band blend': 'Farther brings in more band and monitors — the opposite of what a loud stage needs.',
      'Turn the channel up until it cuts through': 'More gain raises everything that mic hears, and brings feedback closer.',
    },
  },
  superNull('tb.ctx.2', 'context', 'wedge'),
  {
    id: 'tb.ctx.studio',
    page: 'context',
    prompt: 'A trombone overdub in a large, good studio room. What is a fair plan?',
    options: ['A safe main mic, then try a view about 3 m away', 'A mic right at the bell, for the most detail', 'Two mics either side of the slide, for stereo'],
    correct: 'A safe main mic, then try a view about 3 m away',
    explain: 'Get a reliable main mic outside the slide’s path first. In a large, good room, a mic about 3 m away can add scale — hear each alone and the pair in mono.',
    why: {
      'A mic right at the bell, for the most detail': 'Very close takes the full blast and can overload; start with a balanced view.',
      'Two mics either side of the slide, for stereo': 'Stereo is not a requirement for one horn — and the slide side is a keep-out.',
    },
  },
  {
    id: 'tb.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A stage sub shakes the riser under the mic stand. How do you tell it from the horn’s lows?',
    options: ['Test with the PA up and the horn silent', 'Boost the lows until the horn is louder', 'Assume it is the horn and filter it away'],
    correct: 'Test with the PA up and the horn silent',
    explain: 'Riser and sub vibration reach a stand mic as rumble. Hear it with the horn silent, steady or isolate the stand, and only then filter — checking the lowest wanted notes.',
    why: {
      'Boost the lows until the horn is louder': 'More low end raises the rumble too.',
      'Assume it is the horn and filter it away': 'A filter can take the horn’s real lows with it. Find the source first.',
    },
  },
  {
    id: 'tb.two.1',
    page: 'twoMic',
    prompt: 'A close trombone mic and a mic about 3 m away sound thin together. Why?',
    options: ['The sound reaches them at different times', 'The far mic flips the sound’s polarity', 'The close mic is louder, so it cancels'],
    correct: 'The sound reaches them at different times',
    explain: 'The far mic hears each note later. Summed, some pitches arrive out of step and cancel — a comb of notches, which can thin the lowest notes. Move or rebalance first, then check polarity at matched levels.',
    why: {
      'The far mic flips the sound’s polarity': 'Distance delays a sound; it does not flip its sign.',
      'The close mic is louder, so it cancels': 'A level difference changes the notches’ depth; the delay makes them.',
    },
  },
  polarityDelay('tb.two.2'),
  matchedLevels('tb.two.3'),
  {
    id: 'tb.two.4',
    page: 'twoMic',
    prompt: 'The bass trombone plays in a section with a section mic up. How do you use its spot mic?',
    options: ['Raise it for the low line’s balance; check mono', 'Make it loud, as the bass carries the section', 'Mute the section mic whenever the bass trombone plays'],
    correct: 'Raise it for the low line’s balance; check mono',
    explain: 'Hear the section first; the spot helps the low line speak. Too much and the bass sounds detached. Check the blend in mono — arrival-time differences can thin the low register.',
    why: {
      'Make it loud, as the bass carries the section': 'A loud spot detaches the bass from the section and raises its neighbours’ spill.',
      'Mute the section mic whenever the bass trombone plays': 'The section mic is the picture of the group; the spot only supports it.',
    },
  },
  gainCheck('tb.prac.gain', W),
  {
    id: 'tb.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second trombone mic?',
    options: ['The main mic works alone, the pair adds, mono holds', 'Two channels give the mixer more choices later on', 'The trombone needs more level than one mic gives'],
    correct: 'The main mic works alone, the pair adds, mono holds',
    explain: 'A second mic — the room, or a different view — blends a perspective and a delay. If the pair loses body, move or rebalance it, check polarity — or leave it out.',
    why: {
      'Two channels give the mixer more choices later on': 'More channels add spill, a cable and a combining check. A second mic should earn its place.',
      'The trombone needs more level than one mic gives': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'tb.mix.1',
    page: 'practice',
    prompt: 'The player sits for the second set. What do you recheck?',
    options: ['The slide’s reach and the mic’s clearance again', 'Nothing, as long as the stand has not been touched', 'Only the gain, as seated players play softer'],
    correct: 'The slide’s reach and the mic’s clearance again',
    explain: 'A new posture moves the bell and the slide’s path. Recheck the full reach with the player after any change of chair, stand, riser or mute.',
    why: {
      'Nothing, as long as the stand has not been touched': 'The player moved, so the slide’s path moved. Check it again.',
      'Only the gain, as seated players play softer': 'Seated players need not play softer — and the clearance changed.',
    },
  },
  nullOnPaper('tb.mix.2', 'wedge'),
  removeDelay('tb.mix.3'),
];

const symptoms: Symptom[] = [
  {
    id: 'tb.sym.slide',
    observation: 'The slide comes near the stand or cable',
    firstChecks: 'Has the full sweep been tested since the last move? Stop playing; move the stand, boom or cable; retest the whole path.',
    options: ['Stop; move the hardware; retest the whole sweep', 'Ask the player to shorten their slide positions', 'Tape the cable along the slide to keep it tidy'],
    correct: 'Stop; move the hardware; retest the whole sweep',
    explain: 'The slide is precision tubing and the player must reach every position. Stop, move the hardware out of the path with a buffer, and retest the full sweep with the player.',
    why: {
      'Ask the player to shorten their slide positions': 'Positions set the notes: the player cannot shorten them. Move the hardware.',
      'Tape the cable along the slide to keep it tidy': 'Nothing is fixed to the slide — it must move freely and stay straight.',
    },
  },
  {
    id: 'tb.sym.strident',
    observation: 'Thin or strident tone',
    firstChecks: 'Is the mic on the bell’s axis — or overloading? Compare off axis at matched level; check the mic’s headroom.',
    options: ['Compare off axis at matched level; check headroom', 'Cut the treble on the channel until it smooths out', 'Ask the player to play everything more softly'],
    correct: 'Compare off axis at matched level; check headroom',
    explain: 'On the axis the mic hears the bright beam; an overloaded capsule smears too. Move the angle first — still clear of the slide — then check the mic takes the peaks.',
    why: {
      'Cut the treble on the channel until it smooths out': 'EQ dulls the horn and cannot undo overload. Fix the angle and the headroom first.',
      'Ask the player to play everything more softly': 'The dynamics are the music. The mic should take them.',
    },
  },
  {
    id: 'tb.sym.low',
    observation: 'The lowest notes vanish',
    firstChecks: 'Is a filter cutting them — or room cancellation, or the balance? Bypass the filter; hear the horn solo and in the ensemble.',
    options: ['Bypass the filter; hear it solo and in the band', 'Boost the lows on the channel until they return', 'Move the mic right up close to the slide’s crook'],
    correct: 'Bypass the filter; hear it solo and in the band',
    explain: 'A high-pass filter set too high, a room null or the balance can all hide the lowest notes. Check the filter first, then the placement — before adding EQ.',
    why: {
      'Boost the lows on the channel until they return': 'If a filter removed them, a boost cannot bring them back cleanly.',
      'Move the mic right up close to the slide’s crook': 'The crook moves — it is a keep-out — and the sound leaves the bell, not the slide.',
    },
  },
  {
    id: 'tb.sym.rattle',
    observation: 'Buzz or rattle from the clip',
    firstChecks: 'Is the clip touching a mute or metal, or the cable or stand vibrating? Stop; check the mount and strain relief with the player.',
    options: ['Stop; check the mount and strain relief', 'Tighten the clip harder onto the bell rim', 'Gate the channel so the rattle drops out'],
    correct: 'Stop; check the mount and strain relief',
    explain: 'A mic mounted on an instrument can pick up vibration and contact noise. Check the clip’s fit and pressure, what it touches and the cable’s strain relief — with the player.',
    why: {
      'Tighten the clip harder onto the bell rim': 'Over-tightening risks the bell and its finish; find what touches instead.',
      'Gate the channel so the rattle drops out': 'A gate would also cut soft notes and decays; fix the mount.',
    },
  },
  brassFeedback('tb.sym.feedback', 'trombone'),
  hollowSymptom('tb.sym.hollow'),
];

const orderTasks: OrderTask[] = [
  {
    id: 'tb.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic trombone setup in the order you would do them.',
    steps: [
      { text: 'With the player, map the slide’s full reach, the posture, valves and mutes', early: 'Start with the player and the movement.' },
      { text: 'Hear the horn unamplified: quiet phrases, accents, the lowest notes', early: 'Listen before choosing a mic.' },
      { text: 'Choose a mic that can take the peaks, and a stand or approved bell clip', early: 'Choose once you know the part and the level.' },
      { text: 'With the player stopped, place it above or beside the slide’s path', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on the strongest accent; check the softest ending', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare angle and distance one change at a time, at matched levels', early: 'Compare only once the level is set safely.' },
      { text: 'Secure stand and cable; retest the whole slide sweep and every mute', early: 'Secure it last, then watch the whole reach again.' },
    ],
    explain: 'A sensible order. The slide comes first and last: map it before any hardware, and retest it after the final placement. Phantom: mute the outputs and lower monitoring before switching it.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'tb.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio, a trombone overdub, a good room. One channel, phantom power available.',
    setups: [
      { id: 'a', label: 'Dynamic 30–60 cm from the bell, out to its side, clear of the slide', ok: true, power: 'none', feedback: 'A recommended starting point, outside the slide’s path — then small changes by ear.' },
      { id: 'b', label: 'Condenser 60–120 cm in front, high and off axis, aimed at the bell', ok: true, power: 'phantom', feedback: 'A recommended starting point for a more open view — check its stand clears the slide at 7th.' },
      { id: 'c', label: 'A stand mic straight in front of the bell, 40 cm out', ok: false, power: 'none', feedback: 'Its stand drops through the slide’s path: the slide would hit it in the lower positions.' },
      { id: 'd', label: 'A clip on the outer slide, near the crook', ok: false, power: 'phantom', feedback: 'Nothing is mounted on the slide: it moves, and it is precision tubing.' },
      { id: 'e', label: 'A mic tucked under the slide, aimed up at the bell', ok: false, power: 'none', feedback: 'Under the slide is its path at every position — and the sound leaves the bell above.' },
    ],
    reasons: [docReason('the centre of the bell’s rim'), clearReason('the slide’s whole path, the hands and the mutes'), DYN_POWER_REASON, { id: 'r.room', label: 'In a good room, a little distance lets the room join the sound', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON('trombone'), LOUD_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point measured from the bell, the slide’s whole path kept clear, and the power the mic needs.',
  },
  {
    id: 'tb.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage: a bass trombone with drums, moving, the valves used in low passages, a plunger in one tune. Phantom power available.',
    setups: [
      { id: 'a', label: 'A miniature on a bell clip, aimed between centre and edge, cable routed clear', ok: true, power: 'phantom', feedback: 'A recommended starting point that rides on the bell — check the fit on the larger bell, the plunger and the triggers.' },
      { id: 'b', label: 'Dynamic beside the bell, out of the slide’s path, pattern aimed at the wedge', ok: true, power: 'none', feedback: 'A recommended starting point if the player keeps to an agreed zone.' },
      { id: 'c', label: 'Condenser 1 m in front, for a natural blend', ok: false, power: 'phantom', feedback: 'On a loud stage a metre away hears the band more than the horn — and its stand meets the slide.' },
      { id: 'd', label: 'A clip on the valve linkage, close to the triggers', ok: false, power: 'phantom', feedback: 'The linkage must move freely, and the thumb works there. Only the bell rim.' },
      { id: 'e', label: 'A boom reaching in over the slide’s crook', ok: false, power: 'none', feedback: 'The crook travels out to 7th: a boom over it is in the slide’s path.' },
    ],
    reasons: [docReason('the centre of the bell’s rim'), clearReason('the slide, the triggers and the plunger hand'), CLIP_POWER_REASON, { id: 'r.move', label: 'A clip that rides on the bell holds the sound as the player moves', role: 'optional', feedback: 'A fair live reason for a clip.' }, BRAND_REASON('bass trombone'), { id: 'r.loudest', label: 'Turn it up until the bass trombone is louder than the drums', role: 'wrong', feedback: 'More gain raises the stage in that mic too, and brings feedback closer.' }],
    explain: 'Two setups pass. What passes is the reasoning: a mount and a place outside the slide’s path, clear of the triggers and the plunger hand, and the power each mic needs.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what decides the note a trombone plays?', options: ['How hard the lips buzz', 'The tube’s air column', 'The bell alone'], after: 'Now STEP through (or PLAY ONCE) and watch the lips, the tube and the bell.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: can a stand mic go straight in front of the bell, 40 cm out?', options: ['Yes, that is the usual place', 'No — the slide is in the way', 'Only with a short stand'], after: 'Try it, then rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The wedge is on the floor in front of the player. Where will a supercardioid aimed at the bell reject it best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn or tilt the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What does a bass trombone have that a tenor usually lacks?',
    options: ['Valves for extra tubing, and a larger bell', 'A longer slide that reaches nine positions', 'A reed fitted into its mouthpiece cup'],
    correct: 'Valves for extra tubing, and a larger bell',
    explain: 'The same tube length, but a wider bore, a larger bell and valves — often F and G♭ — for the lowest notes. Configurations vary.',
    why: {
      'A longer slide that reaches nine positions': 'The slide has seven positions, as the tenor’s; the valves add the extra length.',
      'A reed fitted into its mouthpiece cup': 'No brass instrument has a reed: the lips buzz.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'From which part does nearly all of a trombone’s sound leave?',
    options: ['The bell', 'The slide', 'The tuning slide'],
    correct: 'The bell',
    explain: 'The sound leaves at the bell — every starting point is measured from its rim’s centre. The slide only changes the tube’s length.',
    why: {
      'The slide': 'The slide changes the tube’s length; the sound leaves at the bell.',
      'The tuning slide': 'The tuning slide sets the tuning; the sound leaves at the bell.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Moving the slide out to a higher-numbered position…',
    options: ['Lengthens the tube, so the note falls', 'Shortens the tube, so the note rises', 'Opens a hole to let the sound out'],
    correct: 'Lengthens the tube, so the note falls',
    explain: 'Each position out adds tube on both legs — about a semitone lower — and the crook, hand and arm travel with it.',
    why: {
      'Shortens the tube, so the note rises': 'Out means longer, not shorter.',
      'Opens a hole to let the sound out': 'That is how a woodwind’s keys work. A slide adds tube.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A trombone’s lowest frequencies leave the bell…',
    options: ['Nearly evenly all round', 'Beamed forward only', 'Mostly down to the floor'],
    correct: 'Nearly evenly all round',
    explain: 'Low down the trombone spreads its sound almost evenly in every direction; from about 1 kHz up, the bell beams it forward.',
    why: {
      'Beamed forward only': 'That is the highs; the lows spread round.',
      'Mostly down to the floor': 'The bell points ahead; the lows spread all round it.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'What must a stand, boom and cable stay clear of around a trombonist?',
    options: ['The slide’s whole path, with a buffer', 'The music stand and the player’s view', 'The bell, so the audience can see it'],
    correct: 'The slide’s whole path, with a buffer',
    explain: 'Clearance comes first: the slide out to 7th position with the hand and arm, the mutes, the triggers — and a comfortable buffer. No bell distance is a slide clearance.',
    why: {
      'The music stand and the player’s view': 'Sight lines matter, but safety is about what moves.',
      'The bell, so the audience can see it': 'The view matters less than the slide’s path.',
    },
  },
  hearingDiag('q.6', W),
];

const floorY = TB.floorY;
const wedges: Wedge[] = [
  {
    id: 'wedge',
    label: 'the player’s floor wedge, in front beyond the slide, facing back',
    short: 'WEDGE',
    p: { x: 1500, y: floorY, z: 150 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the floor in front, beyond the slide’s reach, facing back at the player: below and behind a mic aimed across the bell.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
  {
    id: 'side',
    label: 'another player’s wedge, off to the player’s left',
    short: 'SIDE WEDGE',
    p: { x: 900, y: floorY, z: -1350 },
    lift: 150,
    faces: { x: -0.6, y: 0, z: 0.8 },
    note: 'Off to one side, facing another player: on the bell’s side, so check where the pattern points.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
];

export const A02_LESSON: Lesson = {
  id: 'A02',
  labId: 'winds',
  title: 'Trombone and Bass Trombone',
  subtitle: 'Above or beside the slide’s path, aimed across the bell — or a clip on the bell',
  noun: { one: 'trombone', many: 'trombones' },
  model: A02_MODEL,
  micTypeIds: ['instDynCard', 'sdcCard', 'brClip'],
  zones: A02_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'The trombone is a brass instrument with a slide instead of valves: the lips buzz into a cup mouthpiece, and the right hand moves the slide out to make the tube longer — seven positions, from 1st (closed) to 7th (out at arm’s length). The bass trombone has the same 2.7 m tube, a wider bore, a larger bell and valves for its lowest notes.', src: 'Y-TBN-MECH' },
    { title: 'WHERE YOU MEET IT', text: 'Jazz and big bands, horn sections in funk, soul, ska and Latin music, orchestras and brass bands, studio sessions and solos. This lesson covers one trombone: a studio overdub, a live solo, and a spot in a section.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Tenor: a bright, round or blended voice, from smooth lines to big accents. Bass: the foundation under the section — the low notes must keep their weight. Ask what the part needs, and watch the slide: the player must reach every position freely.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'A tenor trombone’s bell is about 20 cm across; a bass trombone’s about 24 cm. The slide reaches past the bell even when closed, and about 56 cm farther at 7th position. The lowest note of the tenor’s usual range is around 82 Hz; the bass goes lower with its valves. This lab draws both horns about that size, played standing.', src: 'Y-YSL354' },
  ],
  sound: {
    stages: [
      { title: 'The lips buzz', text: 'The player’s breath pushes the lips apart; they spring shut; the breath opens them again — a buzz, puffing air into the mouthpiece’s cup each time.' },
      { title: 'A wave runs down the tube', text: 'Each puff starts a pressure wave travelling down the slide and the bell section toward the bell — drawn here as if the tube were unwound.' },
      { title: 'The tube answers', text: 'At the bell, most of the wave reflects back up the tube. The reflections build a standing wave, and its pressure locks the lips to the tube’s own rhythm: that sets the note. Moving the slide changes the tube’s length, and so the notes.', byVariant: { bass: 'At the bell, most of the wave reflects back up the tube. The reflections build a standing wave, and its pressure locks the lips to the tube’s own rhythm: that sets the note. The slide and the valves’ extra loops change the tube’s length, and so the notes.' } },
      { title: 'Sound leaves the bell', text: 'Part of the wave escapes at every cycle — almost all of it at the bell. Low down a trombone spreads its sound nearly evenly all round; from about 1 kHz up, the bell beams it straight ahead.' },
    ],
    attack: 'The start of a note: the lips catching, the tongue releasing the air — the bite and the edge, strongest along the bell’s axis. A mic toward the axis tends to hear more of it; off the axis, a softer start.',
    body: 'The sustained tone: the standing wave in the tube, leaving through the bell — the lows nearly all round, the highs ahead. A mic off to the side tends to hear a softer top; a farther one, more of the room and the section. Both are tendencies, and horns vary.',
    head: { diameterMm: 0, rods: 0, label: 'the bell', strikeSrc: 'PL-2010' },
  },
  setting: {
    items: [
      { id: 'horn', label: 'the trombone and the trombonist', short: 'TROMBONE', note: 'The player stands, the bell section over the left shoulder and the bell pointing out toward the audience; the slide runs straight out from the mouth, below and to the right of the bell. Ringed in amber: the instrument this lesson mics.', prov: { kind: 'illustrative', reason: 'trombone/GEOMETRY_PROPOSAL.md §1 (drawing defaults)' }, tag: 'THE INSTRUMENT', scene: 'all' },
      { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'Beside the player, on the bell’s side — clear of the slide. They must see the music and the band.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit' },
      { id: 'tb2', label: 'a second trombone beside', short: 'TROMBONE 2', note: 'In a section another trombone stands close by, its slide reaching forward too. Keep the stands out of both slides’ paths.', prov: { kind: 'illustrative', reason: 'a typical section layout' }, tag: 'SPILL · SLIDE', scene: 'kit' },
      { id: 'tp', label: 'a trumpet in the section', short: 'TRUMPET', note: 'On the other side: its bell is bright and loud, and it reaches the trombone mic too.', prov: { kind: 'illustrative', reason: 'a typical section layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'kit', label: 'the drum kit', short: 'DRUMS', note: 'Behind the horns: loud, and in every open mic on the stage.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'wedge', label: 'the player’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front — beyond the slide’s reach — facing back at the player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic trombone; in a quiet hall a section mic may be enough. The PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'main', label: 'a main pair for the section', short: 'MAIN PAIR', note: 'In a recording of a section or a band, a main pair hears the whole group; a trombone mic is a spot that supports it.', prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges on the floor; a good room can be part of the sound — in a large one, a mic about 3 m away is an idea to try.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and a band is loud. A closer, aimed mic outside the slide’s path — or a clip that rides on the bell — helps against the stage and feedback. Subs and risers can shake a stand mic.',
    studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. A safe main mic first; in a large, good room a mic about 3 m away can add scale — check the pair in mono.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic trombone setup for a studio overdub and for a loud stage, describe an alternative position, and explain what would justify a second mic. With a real horn and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'room', label: 'Room or stage', kind: 'text' },
      { id: 'horn', label: 'Horn', kind: 'choice', choices: ['tenor trombone', 'bass trombone'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['dynamic, cardioid', 'dynamic, supercardioid', 'condenser', 'miniature on a bell clip', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'reach', label: 'The slide’s reach checked (posture, 7th position)', kind: 'text' },
      { id: 'distance', label: 'Distance from the bell, and the angle off its axis', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The bell’s height above the floor (the lips 1550 mm up, standing) — a drawing default, so no HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The slide’s keep-out buffer (100 mm round its path; the proposal suggests a 150 mm default the learner could set) — a drawing default.', dims: ['br.slidePath'] },
    { text: 'The closed slide (700), the slide’s spacing (70), its place below (120) and beside (130) the bell, the crook 250 ahead of the rim, the bell section (650), the flares (420, 460), the tenor’s bore, the rotors and loops of the bass — drawing defaults; the bells’ diameters (204.4 and 241.3 mm) are the makers’.', dims: [] },
    { text: 'The slide positions are DERIVED by equal temperament on the 2.7 m tube (0 to 559 mm) — approximate: players find them by ear and feel.', dims: [] },
    { text: 'The off-axis bands of each starting point (15–50°, 10–40°), the side away from the slide, and the clip capsule’s 4–13 cm — drawing defaults; the clip’s fit on the bass bell is not known.', dims: [] },
    { text: 'The radiation shapes on HOW IT SOUNDS — a simplified picture of the measured trend (the bass trombone’s is expected, not measured).', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every horn, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical standing hold, the slide’s positions as the ideal ones, the tube drawn unwound, the bell’s spread of sound as a simplified shape, mic patterns and the two-mic comb as textbook shapes, and waves drawn larger so you can see them. Distances are rounded to about 5 mm and measured from the bell rim’s centre to the mic’s front. Place real mics with the player stopped, and only with their agreement — and never let anything touch the slide.',
  copy: A02_COPY,
};
