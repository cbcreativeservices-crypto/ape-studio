/**
 * C07 ACOUSTIC BASS GUITAR — the pages' words, built by the strings copy
 * (starting-points voice; no sources, brands or badges).
 */
import { stringsCopy } from '../shared/guitars/stringsCopy.ts';
import { familyWords, type Noun } from '../shared/guitars/stringsContent.ts';
import { C07_BUILT, C07_SHIELD } from './geometry.ts';

export const BASS: Noun = { one: 'bass', the: 'the bass', player: 'bassist' };
const g = C07_BUILT.scenes.bass.g;

export const C07_COPY = stringsCopy({
  n: BASS,
  subject: { bass: 'a seated player with an acoustic bass guitar' },
  variantKey: 'BODY',
  variantShort: { bass: 'acoustic bass' },
  figureLabel: 'Front view of a seated player with an acoustic bass guitar: a large cutaway body with its sound hole, the bridge, four heavy strings over a long neck to the headstock, the plucking hand over the body and the fretting hand on the neck.',
  partsIdle: 'Four heavy strings drive the bridge; the bridge drives the top; the top and the air in the body make the sound — the next page shows how.',
  radiator: 'top',
  strikes: [
    { id: 'bridge', label: 'NEAR THE BRIDGE', mm: 60, blurb: 'About 6 cm (2.4 in) from the saddle — the bright, punchy end.' },
    { id: 'hole', label: 'OVER THE HOLE', mm: g.hole.x, blurb: 'Over the sound hole, where many players pluck.' },
    { id: 'neck', label: 'NECK END', mm: g.edge, blurb: 'Where the neck meets the body — a rounder, softer pluck.' },
    { id: 'middle', label: 'THE MIDDLE (12TH)', mm: g.L / 2, blurb: 'The exact middle of the open string, over the 12th fret.' },
  ],
  strikeDefault: 'hole',
  striker: 'FINGER',
  strikerPhrase: 'finger',
  soundReveal: 'Even a heavy bass string moves little air on its own: the bridge rocking the TOP makes most of the sound — and on the lowest notes, the body and its air struggle to keep up.',
  soundAfter: 'Then the strings, the top and the air in the body keep ringing together — the BODY of the note. On a bass the lowest notes are long and deep; a small body radiates them less strongly than the upper ones.',
  shapesNote2: 'This is an ideal string between rigid ends. A heavy bass string is stiff, so its upper shapes run a little sharp of whole numbers — one reason a real bass never sounds like this picture alone.',
  coupledNote: 'The top bows in and out round the bridge and pumps the air through the sound hole — a simplified picture of the lowest motion. A close mic hears the part of the top, the hole or the strings it faces most.',
  setting: {
    kitA11y: 'The bassist from above, seated with the instrument: the chair behind, a vocal mic in front of the mouth, a DI box on the floor by the tail.',
    kitIdle: 'The space round a seated bassist is theirs: the plucking hand over the body, the fretting hand travelling a long neck, and their view of it.',
    leftHanded: 'Left-handed players hold it mirrored: the neck points the other way, and so does everything that keeps clear of it.',
    stageA11y: 'A small stage from above: the bassist with a floor wedge in front, a bass amp and a drum kit upstage, the PA at the front corners and the audience edge.',
    studioA11y: 'A studio room from above: the bassist on a rug, no monitors on the floor, the walls round them.',
    stageIdle: 'A wedge in front, the band and the drums behind, the PA facing out: on a loud stage the bass’s own pickup often carries the level.',
    studioIdle: 'No monitors on the floor. The room — and its low-frequency build-up — is part of the picture now.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Fingers, a pick, slaps or taps on the body? Will the part use the lowest string? Do they sing or move? Hear the bass unamplified, from where the mic will go, across its whole range. A buzz or a rattle is the player’s to fix: a mic cannot repair an instrument.' },
      { title: 'NAME EVERY PATH', text: 'A microphone in the room hears the air round the bass. A pickup (and its DI) is a separate electrical path; some basses also carry an internal mic, hearing the inside of the body; an amplifier’s speaker is another path again. Label each one for what it is.' },
    ],
  },
  workedZone: { bass: 'neck.bass' },
  workedAim: 'Angle it to take in the top and the strings — the lab counts it while the mic’s axis, followed in, meets the top within about 13 cm of {head} — and not straight into the sound hole.',
  clearWhat: 'the plucking hand and arm, the fretting hand along the long neck, and the player’s view of it',
  placementReveal: 'Toward the hole tends to bring more low-mid body — and boom close in; toward the neck, more string and finger. Every bass and room differs, so “it depends on this bass” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
  typeNotes: {
    sdcCard: 'Ideas to try: begin at the neck joint, then move one thing at a time — toward the hole, toward the bridge, a little farther back — and play the lowest notes each time.',
    instDynCard: 'Ideas to try with a dynamic: a little closer, and watch the bass that proximity adds on the low strings.',
    clipCond: 'Ideas to try with a clip-on: keep the capsule over the top between the neck joint and the hole, and compare the low notes with a stand mic.',
  },
  learnSeparate: 'Distance, position along the bass and angle are separate variables: change one at a time. On this cutaway body the neck meets the body at the 17th fret, so the 12th fret is well out on the neck. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
  learnTendencies: 'There is little published guidance for this instrument: these starting points borrow from the guitar, and say so. Near the neck joint is a balanced start; toward the hole adds body and boom; farther back, more room — and room build-up on low notes. With a directional mic, proximity adds bass very close.',
  context: {
    zone: 'neck.bass',
    shield: C07_SHIELD,
    plan: { u0: -750, u1: 1250, v0: -700, v1: 1600 },
    side: { u0: -750, u1: 1250, v0: -700, v1: 720 },
    frontIds: ['voice'],
    looking: 'From above · mic near the neck joint',
    points: [
      { title: 'THE PICKUP', text: 'On a loud stage an acoustic bass with a pickup often needs that feed for dependable level; a close mic adds acoustic character as far as feedback allows. Compare each alone, then together in mono.' },
      { title: 'LOW NOTES AND THE ROOM', text: 'Studio: a room resonance can make one low note boom and another vanish. Move the player or the mic before reaching for EQ, and judge low notes on monitors that can play them.' },
      { title: 'SPILL', text: 'The bass’s acoustic level can be modest next to drums and amps. On a stage, isolation is a performance and room decision as much as a mic choice.' },
      { title: 'MOVEMENT', text: 'A clip moves with the bass; a stand mic hears the player turning. Mark a comfortable position and test the whole performance.' },
    ],
    body: 'With a wedge in front, a pattern’s rejection is a tool to aim. Low frequencies are where every pattern rejects least — so expect more wedge low end than the picture suggests.',
    studioId: 'ab.ctx.studio',
    studioPrompt: 'A studio session in a good room: what is the room worth to this bass?',
    studioNote: 'In a quiet studio a farther mic blends the bass with the room — and with the room’s low-end build-up. Repeated trials are practical when the player stops. Switch back to LIVE for the wedge exercise.',
  },
  twoMic: {
    A: 'neck.bass',
    B: 'upper.bass',
    learn: [
      'A second bass mic — or the pickup alongside one mic — is a choice for a defined contribution, not a requirement. Establish one good mic first; keep the second only if it improves the bass in the song.',
      'When it goes in: solo each, then hear the pair in MONO at matched levels, across the whole range. Low notes are where cancellations hurt most. Move or rebalance a mic before reaching for polarity or a delay — no fixed setting suits every pickup or pair.',
    ],
  },
  practice: { prefix: 'ab', mixedIntro: 'Three cards from earlier pages, mixed: a reference point, a pattern’s null, and polarity versus delay.' },
  words: familyWords(BASS),
});
