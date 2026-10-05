/**
 * M11 COMPLETE DRUM-KIT SETUPS — the pages' words (engine/model/copy.ts) and
 * the words of the lesson's own pages (orient, how the kit sounds to many
 * mics, the channel plan, the routing). Starting points; no sources, brands
 * or names (owner ruling 2026-10-04).
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import type { KitOrientWords } from '../shared/kitPages/PKitOrient';
import type { ArrivalsWords } from '../shared/kitPages/kitSoundSteps';

export const M11_COPY: Partial<LessonCopy> = {
  variantKey: 'WHERE',
  variantShort: { studio: 'studio', live: 'live stage' },
  sceneSubject: { studio: 'a 5-piece drum kit in a studio, with its channel plan', live: 'a 5-piece drum kit on a stage, with its channel plan' },
  viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
  instrument: {
    figureBadge: 'A 5-piece kit — every source a plan can mic',
    figureLabel: 'Side view of a 5-piece drum kit: the hi-hat and the crash on the left, the snare, the rack toms over the kick, the floor tom and the ride on the right, the drummer’s keep-out hatched.',
    partsBadge: 'The kit from the side and from above · a typical right-handed layout · tap a part',
    partsLooking: { side: 'Side view · from the player’s right', top: 'Top view · from above' },
    partsIdle: 'A complete setup is a coordinated view of kick, snare, toms and cymbals — any room sound chosen deliberately. Tap a part to see what it means for a channel plan.',
    variantNotes: { live: 'LIVE STAGE: the same kit with monitors and a PA. Every open mic hears them.' },
  },
  setting: {
    kitA11y: 'The drum kit from above: the kick in the middle, the snare and hi-hat to the player’s left, the floor tom and ride to the right, the rack toms over the kick and the crashes above them.',
    kitLanding: 'Tap anything on the kit — or step through ITEM — to see what it means for a channel plan. There is nothing to answer yet.',
    kitIdle: 'Every source on the kit reaches every open mic — closer ones louder and sooner. A plan chooses which sources get their own channel.',
    leftHanded: 'Left-handed players set the kit up mirrored: the plan mirrors with it.',
    stageA11y: 'The kit on a stage, from above: the drummer’s fill monitor beside the throne, a downstage wedge on the audience side, and the audience and PA to the right.',
    studioA11y: 'The kit in a studio room, from above: no monitors on the floor; the room’s walls around it.',
    stageIdle: 'Two floor monitors and a PA: on a stage every open mic hears them, so a plan uses the channels the audience needs.',
    studioIdle: 'No monitors. A studio may keep separate tracks even when the blend uses few.',
    before: [
      { title: 'DECIDE WHAT THE MUSIC NEEDS', text: 'Have the drummer play the real song or show passage — kick pattern, snare accents and ghost notes, tom fills, the hi-hat foot, the ride and each crash. Listen at the kit and from where the audience or the control room listens. Write a target before patching: an open jazz picture, a dry pop kit with separate toms, a live stage needing kick and snare definition, a stereo recording with natural room.' },
      { title: 'FIX THE SOURCE WITH THE PLAYER', text: 'Check tuning, rattling heads or hardware and the playing balance with the drummer before trying to repair a physical problem with microphones.' },
      { title: 'CLEARANCE FOR EVERY CHANNEL', text: 'Each mic is another stand, cable and clamp near a moving player. Stop the playing before moving hardware; keep the sticks’, cymbals’, pedals’ and the player’s whole movement clear; counterweight long booms; check any rim clamp for fit.' },
    ],
  },
  twoMic: {
    variant: 'studio',
    A: { typeId: 'kickDynSuper', pattern: 'supercardioid', zone: 'kit.kick.out' },
    B: { typeId: 'ohPencil', pattern: 'cardioid', zone: 'oh.gj.main' },
    learn: [
      'A close mic and an overhead hear the same drum at two different times: the close mic first, the overhead a few milliseconds later. Summed, that delay notches the drum — the same comb as any pair.',
      'So build the picture first — the overheads or a whole-kit mic — then bring each close mic up one at a time, at a plausible level, and check in mono. If a hit turns hollow or weak, change the position or the balance; try polarity only as a test. A polarity switch changes the sign; it does not remove the time difference.',
    ],
    warn: 'This graph is a simplified picture: one point source, straight paths, no room. The close mic and the overhead hear different surfaces of the drum at very different levels, so read the notch depths as illustrative. Judge the blend by ear, in mono, at matched levels.',
  },
  practice: {
    gain: 'kt.prac.gain',
    second: 'kt.prac.3',
    mixed: ['kt.mix.1', 'kt.mix.2', 'kt.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: bleed, a close mic against the overheads, and where a room feed goes.',
  },
};

export const M11_ORIENT: KitOrientWords = {
  start: 'This lesson is about complete drum-kit setups — from one whole-kit mic to an extensive channel plan, and how the channels work together. First the kit as a set of sources: what each part is, how they all reach every mic, and where everything sits. Then the microphones, a worked plan, your own plans and their routing. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  newPath: 'Good — NEXT takes you through the kit first. You can change how you started here at any time.',
  partsPrompt: 'Tap any part — or step through PART — to see what it means for a channel plan. There is nothing to answer on this page.',
};

export const M11_ARRIVALS: ArrivalsWords = {
  title: 'Every mic hears everything',
  badge: 'Straight paths at 20 °C (343 m/s, about 34 cm per millisecond) · no room, no level · silent',
  prompt: 'Drag TIME from 0, then change the POINT from one close mic to another. Which source arrives first at each?',
  looking: 'One mic position, four sources',
  note: 'A close mic hears its own drum first and loudest — and every other source a little later and quieter. That is bleed: part of every multi-mic setup, to use or to reduce, never to erase.',
  arrived: 'arrived at',
  pending: 'arrives at',
};

export const PLAN_WORDS = {
  watchTitle: 'Worked plan',
  watchLooking: 'Building up a plan, one channel at a time',
  watchPrompt: 'STEP through the stages. Each one adds a mic for a reason — the bezel counts what it costs.',
  buildTitle: 'Build a plan',
  buildLooking: 'Your plan',
  buildPrompt: 'Choose a PLAN, then add or remove channels under CHANNELS. Build one small plan (four mics or fewer) and one large one (eight or more), and compare what each costs.',
  done: 'done — a small plan and a large one, built and compared',
  learnStages: 'The stages are functional examples, not a rule to add mics in a fixed order. One whole-kit mic; plus the kick; plus the snare; two overheads with kick and snare; then toms, hi-hat, ride, a snare bottom or a room pair — each only when it gives a control you need. Count the channels, the stands, the inputs and the bleed: an optional channel is not automatically an improvement.',
  learnImage: 'Establish the picture before the close mics: one overhead or a pair, placed so that the kick and snare are usable and the toms and cymbals sit where the music needs them. A coincident pair keeps a steadier mono sum; a spaced pair can be wider and needs a closer mono check. The line through the kick and the snare is a useful centre for the image.',
  learnClose: 'Then each close mic for a purpose: the kick for weight and attack; the snare top from outside the sticks’ path; a mic per tom, or a shared one; a hi-hat or ride spot only when its pattern needs its own balance; crashes left to the overheads unless there is a clear need. Even a close mic hears plenty of bleed — work with it, or move the mic.',
  note: 'The counts describe a plan; they never grade it. A two-overhead jazz plan and a fully spotted rock plan can both be right for their goals.',
};

export const ROUTE_WORDS = {
  title: 'Route the feeds',
  looking: 'The expanded plan’s channels and where each one goes',
  livePrompt: 'LIVE: keep the room pair out of the PA and the monitors — on the record and broadcast feeds only — with the kick and snare in the PA. Tap a cell to route or unroute it.',
  studioPrompt: 'STUDIO: a session may keep every channel on its own track, even when the blend uses few. Switch to LIVE for the routing task.',
  done: 'done — live, the room pair feeds only the recording and broadcast',
  learn: [
    { title: 'STUDIO', text: 'Separate tracks keep later decisions open. In a shared room, other instruments’ bleed can make the kit cohesive — or reduce later control. A poor-sounding room may favour more close pickup.' },
    { title: 'LIVE', text: 'Open mics hear the monitors and the PA: use the channels the audience needs and check gain before feedback with the system operator. A room or audience mic for a recording or broadcast can stay out of the PA and the wedge mixes.' },
    { title: 'SOUNDCHECK', text: 'The drummer plays the whole show’s dynamics; the operator checks the kick, snare and tom balance, the cymbals, the monitor sends and the level at the audience. Check mutes, patching and polarity labels. Never induce feedback, and never fix feedback only with a fader after an earlier stage has overloaded.' },
  ],
};
