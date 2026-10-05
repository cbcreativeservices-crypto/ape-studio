/**
 * C05a BANJO — the pages' words (starting-points voice; no sources, brands
 * or badges).
 */
import { stringsCopy } from '../shared/guitars/stringsCopy.ts';
import { familyWords, type Noun } from '../shared/guitars/stringsContent.ts';
import { C05A_BUILT, C05A_SHIELD } from './geometry.ts';

export const BANJO: Noun = { one: 'banjo', the: 'the banjo', player: 'banjo player' };
const g = C05A_BUILT.scenes.reso.g;

export const C05A_COPY = stringsCopy({
  n: BANJO,
  subject: { reso: 'a standing player with a resonator banjo', open: 'a standing player with an open-back banjo' },
  variantKey: 'BACK',
  variantShort: { reso: 'resonator banjo', open: 'open-back banjo' },
  variantNotes: { open: 'OPEN BACK: no resonator behind the pot, so more sound leaves behind it — into the player’s body, which can obstruct a mic placed there.' },
  figureLabel: 'Front view of a standing player with a five-string banjo: a round pot with a white head stretched on its hooks, a thin bridge on the head, the tailpiece, a long neck with the short fifth string starting at a peg partway up, the peghead.',
  partsIdle: 'The strings press a thin bridge onto the head; the head, a drumhead, makes most of the sound — the next page shows how.',
  radiator: 'head',
  strikes: [
    { id: 'bridge', label: 'NEAR THE BRIDGE', mm: 45, blurb: 'About 4.5 cm (1.8 in) from the bridge — the bright, snappy end.' },
    { id: 'pot', label: 'OVER THE HEAD', mm: 110, blurb: 'Over the head near the neck end, where many players pick.' },
    { id: 'neck', label: 'NECK END', mm: g.edge + 40, blurb: 'Just past where the neck meets the pot — a rounder pluck.' },
    { id: 'middle', label: 'THE MIDDLE (12TH)', mm: g.L / 2, blurb: 'The exact middle of the open string, over the 12th fret.' },
  ],
  strikeDefault: 'pot',
  strikerPhrase: 'pick',
  soundReveal: 'The strings never touch the head: they press the BRIDGE onto it, and the bridge drives the head — a tensioned drumhead, which is why a banjo sounds so bright and quick.',
  soundAfter: 'Then the strings and the head ring on — briefly, for a head damps fast. A resonator reflects some of the sound forward; an open back lets more go behind, into the player.',
  shapesNote2: 'This is an ideal string between rigid ends. On a banjo one end is a light bridge standing on a moving head — the reason a real banjo never sounds like this picture alone.',
  coupledNote: 'The head bows in and out round the bridge — a simplified picture of its lowest motion. The next step shows the head’s other shapes, driven off-centre by the bridge.',
  setting: {
    kitA11y: 'The banjo player from above, standing with the banjo on a strap, a vocal mic in front of the mouth.',
    kitIdle: 'The space round a banjo player is theirs: the picking hand and forearm over the head, the fretting hand travelling the neck, and the long neck itself swinging as they move.',
    leftHanded: 'Left-handed players hold it mirrored: the neck points the other way, and so does everything that keeps clear of it.',
    stageA11y: 'A small stage from above: the player with a floor wedge in front, a shared band mic out front, the band upstage, the PA at the front corners.',
    studioA11y: 'A studio room from above: the player on a rug, no monitors on the floor, the walls round them.',
    stageIdle: 'A wedge in front, the band behind, the PA facing out. A bluegrass band may instead share one or two mics and step in for solos.',
    studioIdle: 'No monitors on the floor. The room — and, with an open back, the player’s body — is part of the picture now.',
    before: [
      { title: 'ASK THE PLAYER FIRST', text: 'Fingerpicks or clawhammer? A mute? Resonator or open back? Will they step in to a shared mic for solos? Hear the banjo unamplified, from the front — and, for an open back, round the back where you can. Check the head and bridge look stable, without touching them.' },
      { title: 'THE SETUP IS THE PLAYER’S', text: 'Head tension, the bridge’s position and the resonator are not miking steps. Never rest a mic or clip on the head, move the bridge or tighten hardware. A buzz that is there with the mic muted is the player’s to fix.' },
    ],
  },
  workedZone: { reso: 'joint.reso', open: 'joint.open' },
  workedAim: 'Aim it at the junction of the neck and the pot — the lab counts it while the mic’s axis, followed in, meets the banjo within about 12 cm of {head}. Distance, position and angle are separate things to try.',
  clearWhat: 'the picking hand and forearm, the fretting hand, the swinging neck and the player’s view',
  placementReveal: 'Close in front of the head tends to bring attack and the head’s punch; at the neck junction, more of a blend with the strings and fingers. Banjos differ, so “it depends on this banjo” is fair too. Each zone’s LISTEN FOR line is an idea to check by ear, not a promised result.',
  typeNotes: {
    sdcCard: 'Ideas to try: begin at the neck junction, then move between the junction, the head and a broader front view — one change at a time, the same phrase, at matched levels.',
    instDynCard: 'Ideas to try with a dynamic: close in front of the head, watching for a hard, papery head sound and the picking hand.',
    clipCond: 'Ideas to try with a clip-on: an approved clip by the tailpiece, aimed at the bridge — never on the strings, the bridge or the head.',
  },
  learnSeparate: 'Distance, position and angle are separate variables: change one at a time. “3 in from the head’s centre” and “30–40 cm from the neck junction” are different places for different jobs — do not treat them as the same coordinate. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm.',
  learnTendencies: 'The neck junction is a blend of strings, fingers and head; toward the bridge and head, more attack and projection; more toward the neck, articulation; farther back, the whole banjo and the room. These are listening questions, not fixed bright or warm sides.',
  context: {
    variant: 'reso',
    zone: 'joint.reso',
    shield: C05A_SHIELD,
    plan: { u0: -800, u1: 1250, v0: -700, v1: 2050 },
    side: { u0: -800, u1: 1250, v0: -700, v1: 1150 },
    frontIds: ['voice'],
    looking: 'From above · mic at the neck junction',
    points: [
      { title: 'CLOSE OR SHARED', text: 'A close mic gives more gain before feedback; a bluegrass band sharing one or two mics needs choreography, restrained monitors and a kind room.' },
      { title: 'A FIGURE-8 RIBBON', text: 'One engineer smooths a banjo’s attack with a figure-8 ribbon — and rules it out when there are floor monitors, because a figure-8 hears its back as loudly as its front.' },
      { title: 'LOUD UP CLOSE', text: 'A banjo can be very loud close in: one engineer measured about 105 dB near one. One reading, not a rule — measure, and protect hearing.' },
      { title: 'THE PICKUP', text: 'A pickup is a separate electrical path. If blending it with a mic, compare each alone and together in mono.' },
    ],
    body: 'With a wedge in front, a pattern’s rejection is a tool to aim. A tight pattern is not automatically natural: very close miking magnifies a small region and the playing noises.',
    studioId: 'bj.ctx.studio',
    studioPrompt: 'A quiet studio, a good room, solo banjo: when could an omni be the right choice?',
    studioNote: 'In a quiet, good room an omni near the neck junction gives a detailed, broad view — and the room with it. Try a cardioid when the room or neighbours need more control. Switch back to LIVE for the wedge exercise.',
  },
  twoMic: {
    variant: 'reso',
    A: 'joint.reso',
    B: 'centre.reso',
    learn: [
      'Establish the one-mic result first. Two mics on distinct regions can offer tonal control — but summed they may thin or colour the sound. Stereo (two omnis about 30–40 cm out, an XY pair, or a spaced pair) is a deliberate choice, not an automatic improvement.',
      'When it goes in: hear the pair in MONO at matched levels, with the player moving naturally. Move and rebalance rather than relying on a polarity switch.',
    ],
  },
  practice: { prefix: 'bj', mixedIntro: 'Three cards from earlier pages, mixed: a reference point, a pattern’s null, and polarity versus delay.' },
  words: { ...familyWords(BANJO), inside: 'inside the pot', mountClip: 'Mount: an approved clip by the tailpiece or on the rim — never on the strings, the bridge or the head, and only with the player’s OK' },
});
