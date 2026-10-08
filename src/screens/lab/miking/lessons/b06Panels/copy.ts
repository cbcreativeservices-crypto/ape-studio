/**
 * B06 PANELS, PRESS CONFERENCES AND GROUPS — the shared pages' words
 * (engine/model/copy.ts), on the voice family's words with the lesson's own:
 * the panel table and the lectern, goosenecks, the shared boundary, the
 * question mic, the PA, the press feed. Starting-points voice (owner ruling
 * 2026-10-04): no sources, brands or badges. Every number is from
 * panels_press/SOURCES.md (after correction B06-1) or a named drawing
 * default (CORRECTIONS_LOG "L7G1").
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { standingVoiceCopy } from '../shared/voice/voiceCopy.ts';

const INTRO = 'This lesson is about putting microphones on a group of talkers — a panel at a table, a presenter at a lectern, questions from the audience — and sending the right voices to the PA, the stream and the press. First the talkers: where each voice leaves, what a turn to a neighbour does, and what every open mic hears; then real starting setups, the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.';

const BASE = standingVoiceCopy({
  what: 'a panelist or a presenter',
  startIntro: INTRO,
  contextIntro: 'These are scenario-based comparisons, not restrictions: the talkers are the same — the room, the open mics and the PA change.',
  worked: { studio: 'b6.goose', live: 'b6.lectern' },
  liveZone: 'b6.lectern',
  pairA: 'b6.lectern',
  pairB: { p: { x: 0, y: 0, z: 0 }, az: 0, el: 0 },
  practice: { gain: 'b6.prac.gain', second: 'b6.prac.3', mixed: ['b6.mix.1', 'b6.mix.2', 'b6.mix.3'], mixedIntro: 'Three cards from earlier pages, mixed: the open mics, the press feed, and polarity versus delay.' },
  before: [
    { title: 'MAP THE POSITIONS AND THE DESTINATIONS', text: 'Before any mic: draw every speaking position — the moderator, the panelists, the lectern, the audience question point, a remote contributor, an interpreter — and where each voice must go: the PA, the stream, the recorder, the press feed, a remote return. A lectern mic does not cover the aisle.' },
    { title: 'ASK WHO TURNS AND WHO MOVES', text: 'Walk the stage: who turns to whom, who stands or steps away, who handles paper or speaks softly. A body-worn mic goes on a person only with their agreement.' },
    { title: 'THE PRESS FEED, WITH THE EVENT AUDIO LEAD', text: 'Check the exact port: its connector, its level, its isolation and its phantom-power policy. Line level into a mic input overloads; mic level into a line input is too quiet. No phantom power into a feed nobody has verified, and no passive splitter cable for many reporters.' },
    { title: 'NEVER PROVOKE FEEDBACK', text: 'Start with only the needed speech mics open; set usable gain for the quietest speaker without raising a distant mic to make up for its place. Never raise gain to provoke feedback as a test. Protect cable paths, stands and accessible routes.' },
  ],
  studio: {
    id: 'b6.ctx.studio',
    prompt: 'A small, quiet studio roundtable with no PA, four people close together. What is a fair first setup?',
    note: 'With no PA and everyone close, individual goosenecks give the most control — or one shared boundary between two, if everyone stays near it. Switch to LECTERN for the PA exercise.',
  },
  contextPoints: [
    { title: 'INDIVIDUAL OR SHARED', text: 'A gooseneck each gives the most control for soft or overlapping talkers; a shared boundary is simpler and smaller to see, but farther from each mouth — fine for a quiet room, poor with a PA.' },
    { title: 'OPEN MICS', text: 'Live, every open mic hears the PA and the room: each doubling costs about 3 dB of gain before feedback. Mute the mics no one is using, by hand or with a configured automatic mixer.' },
    { title: 'THE LECTERN HANDOFF', text: 'When a presenter leaves the lectern for a headset or a lavalier, plan who mutes which: both open on one voice comb and cost margin.' },
    { title: 'THE FEED', text: 'A stream and a press feed carry only what is routed into them: route the audience question and any remote voice on purpose, and check them at the destination.' },
  ],
});

export const B06_COPY: Partial<LessonCopy> = {
  ...BASE,
  variantKey: 'WHERE',
  variantShort: { panel: 'panel', lectern: 'lectern' },
  sceneSubject: { panel: 'four panelists seated at a table', lectern: 'a presenter at a lectern, a question mic in the aisle' },
  viewTag: { side: 'SIDE · FROM THE TALKER’S RIGHT', top: 'TOP · FROM ABOVE' },
  axes: {
    x: { plus: 'toward the audience', minus: 'toward the talker', label: 'IN–OUT', blurb: 'Out from the talker toward the audience, or back toward them (x). Distances are read from the lips.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). The lips are at height 0: below them the chin, the chest and the table or the lectern.' },
    z: { plus: 'to talker’s right', minus: 'to talker’s left', label: 'ACROSS', blurb: 'Toward the talker’s right or left (z) — along the table to the next panelist.' },
  },
  instrument: {
    ...BASE.instrument!,
    figureBadge: 'A panelist at a table · every part named',
    figureLabel: 'A panelist seated at a skirted table, seen from the right, a gooseneck base in front.',
    partsBadge: 'A panel or a lectern · tap a part to name it',
    partsLooking: { side: 'Side view · from the talker’s right', top: 'Top view · from above' },
    partsIdle: 'Each voice leaves through its mouth — every distance is read from the lips. Around the talkers: the table, the gooseneck bases, the lectern, the aisle, the PA. Tap any of them.',
    variantNotes: {
      panel: 'PANEL: four panelists 70 cm apart behind one table, each with a gooseneck; a shared boundary is the other idea. Switch WHERE to see the lectern.',
      lectern: 'LECTERN: a presenter standing at a lectern, a question mic in the aisle, the PA at the stage’s front corner.',
    },
  },
  setting: {
    ...BASE.setting!,
    kitA11y: 'A panel at a table, from above.',
    kitLanding: 'Tap anything around the talkers. There is nothing to answer yet.',
    kitIdle: 'Everything around the talkers is their space, the furniture, or something a mic can hear.',
    stageA11y: 'A presenter at a lectern and an aisle mic, from above.',
    studioA11y: 'A panel at a table, from above.',
    stageIdle: 'The PA faces the audience; every open mic on the stage hears it.',
    studioIdle: 'Four voices, four mics: each mic hears its own talker and, later and lower, the others.',
  },
  placement: {
    ...BASE.placement!,
    workedZone: { panel: 'b6.goose', lectern: 'b6.lectern' },
    workedAim: 'Aim it at the mouth — across the talker’s normal speaking arc; the lab counts it while the mic points within about {tol}° of the lips.',
    workedClear: 'Clear of the talker: the capsule and the neck keep off the face, out of the sight line and the paper’s path, the base away from the hands. Clearance comes first, before any number.',
    reveal: 'Closer tends to bring more voice and less room and fewer neighbours; farther, more room, more of the next panelist and more of each head turn; below the mouth’s line, fewer breath bursts. Talkers vary, so “it depends on this panel” is fair too.',
    typeNotes: {
      bcGoose: 'Ideas to try with a gooseneck: bend the capsule toward the mouth, a little below its line, aimed across the speaking arc; then have the talker turn to a neighbour and listen.',
      bcGooseSuper: 'Ideas to try with a supercardioid gooseneck: tighter at the sides, with a small lobe behind — check where the PA and the next panelist sit against it.',
      bcBoundary: 'Ideas to try with a shared boundary: between two talkers, its front toward them, clear of papers and hands — then a turn from each.',
      vocHeadset: 'Ideas to try with a headset: the capsule where its maker says, near the corner of the mouth — and a plan for muting the lectern.',
      vocDynCard: 'Ideas to try at the aisle mic: coach the questioner to stay within about 10 cm for the whole question.',
    },
    note: 'Clearance comes first: nothing touches the talker, the necks stay out of the sight lines and the camera’s view, the bases away from papers, the aisle stand out of the walking path.',
    learn: {
      intro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the lips to the front of the mic. They are starting points, not rules — move from there and listen. Experimentation is encouraged: every panel, room and PA is different.',
      separate: 'Distance, height and the angle off the mouth’s axis are separate variables: change one at a time. Distances are measured to the mic’s FRONT and rounded to about 5 mm.',
      clearance: 'Clearance comes first: off the face, out of the sight line and the paper’s path, clear of the hands and the aisle.',
      tendencies: 'Closer tends to bring more voice against the room and the neighbours; farther, more room, more bleed and more of each head turn. These are tendencies, and rooms vary.',
    },
  },
  context: {
    ...BASE.context!,
    variant: 'lectern',
    zone: 'b6.lectern',
    typeId: 'bcGoose',
    patterns: [
      { id: 'cardioid', label: 'cardioid', typeId: 'bcGoose' },
      { id: 'supercardioid', label: 'supercardioid', typeId: 'bcGooseSuper' },
    ],
    micNoun: 'A lectern gooseneck',
    shield: [],
    azMax: 60,
    elMax: 45,
    aimBlurb: 'Swing the capsule up to 60° either way — it still faces the mouth.',
    plan: { u0: -600, u1: 2000, v0: -1800, v1: 700 },
    side: { u0: -600, u1: 2000, v0: -1100, v1: 1600 },
    target: 'pa',
    targetWord: 'PA',
    looking: 'The presenter at the lectern · the PA at the stage’s front corner',
    prompt: 'The PA stays where the event needs it. Turn or tilt the gooseneck (AIM), or change its PATTERN, until the PA sits in the rejection — while the capsule still points at the mouth.',
    activityDone: 'done — the PA sat in a null by your aim or pattern',
    cardioidReveal: 'What you just saw: a cardioid rejects most straight behind. Aimed up at the presenter’s mouth, its rear points down and out toward the audience — the PA, up on its stand to one side, is never quite there. Tilt and pattern together decide how much of the PA the lectern mic hears.',
    shieldNote: 'The lectern, the presenter and the room reflect the PA’s sound too, and the free-field pattern cannot show that. Listen with the PA on, at the agreed level.',
    learn: {
      ...BASE.context!.learn,
      body: 'Live, every open mic hears the PA. A pattern’s rejection is a tool to aim; a closer mic and fewer open mics do more.',
      warn: 'No mic position alone prevents feedback: the open mics, the PA’s place and level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
    },
  },
  twoMic: {
    variant: 'lectern',
    label: 'Lectern and headset — one open at a time',
    A: { typeId: 'bcGoose', pattern: 'cardioid', zone: 'b6.lectern' },
    B: { typeId: 'vocHeadset', pattern: 'omni', zone: 'b6.headset' },
    learn: [
      'The presenter at the lectern with a headset on: one voice, two mics, at two distances. The headset hears each word first, the lectern a little later — with both open, the sum combs and the open-mic count goes up.',
      'Choose one: mute the lectern while the headset is live, or the other way round, and rehearse the handoff with whoever does the muting. A second lectern mic can be a separately routed backup; two parallel open capsules rarely improve anything.',
    ],
    warn: 'This simplified graph treats the mouth as one point and both mics as hearing the same sound. Real mics hear different mixes of voice and room — read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative.',
  },
  terms: {
    ...BASE.terms!,
    instrument: 'the talker',
    startIntro: INTRO,
    startNew: 'Good — NEXT takes you through the talkers first. You can change how you started here at any time.',
    otherRef: 'Every starting point here is measured from the lips — where the voice leaves — to the front of the mic. The shared boundary is measured from the nearer panelist’s lips.',
    clipMount: 'Mount: a gooseneck on a weighted table base or a lectern socket (a headset over the ear for a presenter who walks)',
    standMount: 'Mount: a weighted stand in the aisle, its base and cable out of the walking path',
    observation: 'For a real panel, with the talkers’ agreement. Write tendencies in words — what you heard, not a promised result.',
  },
};
