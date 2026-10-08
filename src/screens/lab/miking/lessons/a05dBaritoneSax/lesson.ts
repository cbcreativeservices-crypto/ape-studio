/**
 * A05d BARITONE SAXOPHONE — the lesson as DATA, on the shared saxophone
 * family (lessons/shared/sax/saxLesson.ts). Words: the owner's lesson
 * (docs/labs/miking/source_text/Baritone-Saxophone-Miking-Technique-
 * Research.txt, "L<n>" in COMMENTS only) with the fixes in CORRECTIONS_LOG.md
 * (SX-01 …) applied. Research: docs/labs/miking/baritone_sax/ and the family
 * keys in alto_sax/SOURCES.md.
 *
 * What is the baritone's own: the largest and lowest (L6), a bent neck with a
 * loop, many with a low-A key (L7, Y-SAX-PLAY2); one horn-mounted capsule
 * covers fewer holes (DPA-SAX, L6); close plus room (Hill, L12); its lowest
 * notes sound D♭2, about 69 Hz — 65 Hz with a low A — BELOW a wireless pack's
 * 80 Hz cut (L25, DERIVED; SX-07).
 */
import type { Lesson } from '../../engine/model/types.ts';
import { buildSaxLesson, saxSetupTasks, saxWedges } from '../shared/sax/saxLesson.ts';
import { MOUTH_HEIGHT } from '../shared/sax/saxPosture.ts';
import { BARITONE_SAX } from './geometry.ts';
import { BARITONE_ZONES } from './model.ts';

export const A05D_LESSON: Lesson = buildSaxLesson({
  id: 'A05d',
  pfx: 'bs',
  title: 'Baritone Saxophone',
  subtitle: 'A big horn: above the bell, the triangle from farther off, and the lowest notes',
  F: BARITONE_SAX,
  short: 'baritone',
  Short: 'Baritone',
  zones: BARITONE_ZONES,
  use: { worked: 'bs.above', live: 'bs.above', twoA: 'bs.above', twoB: 'bs.triangle', twoBType: 'saxLdc' },
  orient: [
    { title: 'WHAT IT IS', text: 'The baritone saxophone, pitched in E♭, is the largest and lowest of the four common saxophones. Its long conical tube is folded: a loop at the top of the neck, a long body, the bow and an upturned bell. Many modern baritones have a low A key, one note lower than the others.', src: 'Y-HUB-SAX' },
    { title: 'WHERE YOU MEET IT', text: 'Big bands and horn sections, jazz, R&B and rock, concert bands and saxophone quartets — often doubling the bass line.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'The bottom of the section: weight, punch and the bass line, and a gruff solo voice. Ask for the lowest notes the part uses before you set any filter.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'About a metre tall. Its lowest notes sound near 69 Hz (a D♭), or 65 Hz (a C) with a low A key. It hangs on a harness at the hip, standing or seated — this lab draws one with a low A.', src: 'DPA-TABLE' },
  ],
  place3: {
    prompt: 'Why can a bell clip sound less complete on a baritone than on an alto?',
    options: ['One capsule covers fewer of its widely spaced holes', 'The baritone’s bell is too wide for a clip to grip', 'A clip cuts off the baritone’s low notes by its design'],
    correct: 'One capsule covers fewer of its widely spaced holes',
    explain: 'The baritone’s holes are spread along a much longer body, so one close capsule at the bell hears fewer of them. It still gives a steady, isolated sound; a stand mic a little farther off takes in more of the horn.',
    why: {
      'The baritone’s bell is too wide for a clip to grip': 'Clips are made for baritone bells. The issue is coverage: the holes are spread far apart.',
      'A clip cuts off the baritone’s low notes by its design': 'A clip does not cut lows by itself — though a wireless pack’s low cut can.',
    },
  },
  mic4: {
    prompt: 'A wireless clip pack cuts below about 80 Hz. The baritone’s lowest notes sound near 69 Hz, or 65 Hz with a low A. What follows?',
    options: ['The cut can thin the lowest notes; compare it in and out', 'Nothing — 80 Hz is below the baritone’s whole range', 'It removes the high harmonics that the bell carries out'],
    correct: 'The cut can thin the lowest notes; compare it in and out',
    explain: 'The baritone’s lowest fundamentals — about 69 Hz, 65 Hz with a low A — sit BELOW an 80 Hz cut, so the cut can take weight off them. Listen on the real low line with it in and out; the cut is there for handling noise.',
    why: {
      'Nothing — 80 Hz is below the baritone’s whole range': 'The baritone goes lower: about 69 Hz, or 65 Hz with a low A. Those are below 80 Hz.',
      'It removes the high harmonics that the bell carries out': 'A low cut removes lows, not highs. The bell’s harmonics are far above 80 Hz.',
    },
  },
  q1: {
    prompt: 'Which way does the baritone’s bell point?',
    options: ['Up and forward, curving back up beside the body', 'Down and forward, straight along the line of the body', 'Back toward the player, under the right arm'],
    correct: 'Up and forward, curving back up beside the body',
    explain: 'The baritone’s tube turns at the bow and the bell rises up and forward beside the body, at the player’s hip.',
    why: {
      'Down and forward, straight along the line of the body': 'That is the straight soprano. The baritone’s bell curves back up at the bow.',
      'Back toward the player, under the right arm': 'The bell opens up and forward, away from the player.',
    },
  },
  setup: (R) => saxSetupTasks('bs', 'baritone', R),
  neighbours: [
    { id: 'n1', label: 'a tenor beside (the next horn in the section)', short: 'TENOR', note: 'In a section the next horn sits close: a close mic on the baritone hears it too — more so from the side.', prov: { kind: 'illustrative', reason: 'a typical big-band sax row' }, tag: 'SPILL', scene: 'kit' },
    { id: 'n2', label: 'an alto further along the row', short: 'ALTO', note: 'Farther away, but still heard by the baritone’s mic.', prov: { kind: 'illustrative', reason: 'a typical big-band sax row' }, tag: 'SPILL', scene: 'kit' },
  ],
  stage: 'LIVE: monitors on the floor feed the players, the PA faces the audience, and the band is loud. A closer directional mic improves the direct sound against the spill, but its smaller zone shows every turn of the big horn; keep stands clear of its travel.',
  studio: 'STUDIO: no wedges, a room that may sound good, and repeated trials when the player stops. A big horn rewards distance: a farther mic — the triangle — takes in the whole baritone, alone or beside a close mic.',
  placementReveal: 'Toward the key stack tends to bring warmth and key noise; toward the bell, focus and a nasal edge; farther, more of the whole horn and the room. On a baritone the holes are spread far apart, so distance matters more. Each zone’s LISTEN FOR line is an idea to check by ear.',
  typeNotes: {
    saxDynCard: 'Ideas to try: begin a few centimetres above the bell, aimed at the holes; then compare a little farther and lower, toward the middle of the body, with the lowest and the highest notes each time.',
    saxDynSuper: 'The same places as the cardioid dynamic; its tighter pattern hears less of the stage, and its least-sensitive directions sit toward the rear, off to each side.',
    saxLdc: 'Ideas to try: begin 30–60 cm from the bell, aimed a third of the way up; in a good room try the triangle — about the horn’s length from its top and its bottom.',
    saxClip: 'Ideas to try with a clip: keep it on the rim, angled between the bell and the keys — and remember it hears only part of a big horn.',
  },
  learnIntro: 'What you just did, in words. After our research, each blue zone is where we suggest you begin with that kind of mic, measured from the part it names — the bell, the tone holes, the top and the bottom of the horn. They are starting points, not rules; the bigger the horn, the farther away it can blend. Move from there and listen: there is no single right answer.',
  unknowns: [{ text: 'The baritone’s length: a museum baritone measures app. 96.7 cm overall; the modern height drawn (1 m) and the low-A extension are drawing defaults.', dims: [] }],
  wedges: saxWedges(MOUTH_HEIGHT.standing, 820, 200),
  accuracyExtra: 'The baritone is drawn about a metre tall with a 16 cm bell and a low A.',
  contextBoxes: { plan: { u0: -500, u1: 1850, v0: -700, v1: 1100 }, side: { u0: -500, u1: 1850, v0: -400, v1: 1650 } },
});
