/**
 * Mastering Lab PRACTICE cards: one reason per WRONG option (lab fix round,
 * phase 2, 2026-11-14; owner approval: "Begin fixing all bugs found and do
 * obvious ... fixes as you suggested in the report", item 5, the check card).
 *
 * The audit (G4): "In 31 of the 43 cards a beginner meets at least one
 * generic ✗ … in M4 up to seven in a row." The card now says, on a first miss,
 * why THAT option does not fit (never the right answer); the full explanation
 * comes with the right pick, or after a second, different miss.
 *
 * Keyed by scenario id, then by the option's EXACT text (as `correct` is).
 * Rules (S2's, checked by test/labFixes_20261114_F4.test.ts): one line, at
 * most 30 words, never names or quotes the right option, every key a real
 * wrong option, US spelling.
 */
import { TOOL_OPTIONS } from './masteringContent';

type Why = Readonly<Record<string, string>>;

const MASTER = 'Mastering adjustment';
const MIX = 'Mix revision';
const INFO = 'Ask the client first';

/**
 * Module 4's eight-option tool bank: what each tool is FOR, as a question the
 * learner can check against the goal. Used for every card where that tool is
 * a wrong pick, unless the card says something more specific below.
 */
const TOOL_WHY: Readonly<Record<(typeof TOOL_OPTIONS)[number], string>> = {
  'Broad EQ (shelf or tilt)': 'A broad EQ leans the tone of the whole song. Is this goal about tone at all?',
  'Narrow corrective EQ': 'A narrow EQ fixes one frequency that rings or pokes out. Is this goal about one frequency?',
  'Gentle compression': 'Gentle compression shapes the density of the whole song, moment to moment. Is the goal about how the song holds together?',
  'Peak limiter': 'A limiter catches peaks. Is this goal about peaks that hit too high?',
  'Stereo width / M-S tool': 'A width tool changes how wide the song spreads. Change width only after you know how it folds to mono.',
  'Level trim + loudness meter': 'A level trim changes how loud the whole song plays. Is this goal about level?',
  'Phase correlation / mono check': 'A mono check verifies how the song folds down. It helps when the doubt is about width, not this.',
  'Listen on another system first': 'A second system answers a doubt about your room. Here the goal itself is already clear.',
};

function toolCard(correct: string, over: Why = {}): Why {
  const out: Record<string, string> = {};
  for (const o of TOOL_OPTIONS) if (o !== correct) out[o] = over[o] ?? TOOL_WHY[o];
  return out;
}

export const SCENARIO_WHY: Readonly<Record<string, Why>> = {
  // ── Module 1 · Mix issue or mastering issue? ─────────────────────────────
  t1: {
    [MIX]: 'The whole mix leans dull on every system. Nothing points at one instrument, so the mixer has nothing particular to change.',
    [INFO]: 'The situation is already clear: one broad tone lean, heard on every system, against the client’s own reference.',
  },
  t2: {
    [MASTER]: 'Mastering works on the finished stereo file. Lifting the vocal’s range there also lifts every instrument that lives in it.',
    [INFO]: 'Nothing is unclear here: one element, one section, and the problem is already named.',
  },
  t3: {
    [MIX]: 'The song is well balanced inside. The gap is between songs, and nothing in its mix needs changing.',
    [INFO]: 'Nothing is missing: the level gap is measured and the song itself is fine.',
  },
  t4: {
    [MASTER]: 'Any work on this file may be wasted: it may not be the approved version.',
    [MIX]: 'Nothing says the mix is wrong. What is unclear is which file is the approved one.',
  },
  t5: {
    [MASTER]: 'The distortion is baked into one instrument inside the stereo file. Mastering cannot reach the snare alone.',
    [INFO]: 'The fault is found and named: one snare hit, clipping on its own channel.',
  },
  t6: {
    [MIX]: 'The recording is clean. A fade on the finished song is an edit on the stereo program, not a change inside the mix.',
    [INFO]: 'The client already said what they want: a different fade length.',
  },
  t7: {
    [MASTER]: 'A limiter is already on the mix bus. Limiting the limited file again squeezes it further before anyone knows what “competitive” means.',
    [MIX]: 'Nothing in the balance is wrong yet. First find out what the client means, and what the mix sounds like without its limiter.',
  },
  t8: {
    [MIX]: 'The whole song is a little narrow. Nothing points at one instrument placed wrongly.',
    [INFO]: 'The request is clear: a little wider, across the whole song.',
  },

  // ── Module 2 · Which role? ───────────────────────────────────────────────
  r1: {
    'Boost the snare\'s frequencies with the mastering EQ and compare': 'Every instrument that shares the snare’s frequencies would come forward with it: the vocal and the guitars too.',
    'Add a transient shaper on the whole master and ride it per section': 'A shaper on the master reacts to every hit in the song, not to the snare alone.',
  },
  r2: {
    'Does the bass sit under the kick in the choruses?': 'Two instruments inside one song: that is a relationship inside a mix.',
    'Is the reverb on the lead vocal too long for the verses?': 'One effect on one voice inside one song: a mixing question.',
  },
  r3: {
    'Nothing — it is the same session, the same ears, the same room': 'The person is the same, but the work changes from parts of a song to the finished whole.',
    'Only the plugins and the template they load': 'Tools differ, but that is not what changes most. Think about what you listen to, and what you can still reach.',
  },
  r4: {
    'Making the approved mix as loud as the references': 'Loudness is one decision among many, and sometimes the right one is to stay quieter.',
    'Re-mixing the song with better plugins, a fresh template and new ears': 'Mastering starts from an approved mix. It does not rebuild the song from its tracks.',
  },

  // ── Module 3 · Room and monitoring decisions ─────────────────────────────
  m1: {
    'The second is better — you heard the difference clearly': 'Louder sounds fuller and brighter to almost everyone. A 6 dB jump can make the same file sound better.',
    'The first has less bass and a little less air': 'At a lower level the ear hears less bass and air. That may be the level, not the version.',
  },
  m2: {
    'As loud as the client likes it, so they hear what they paid for': 'Loud for hours tires the ears and risks hearing. Judgments made that loud do not repeat tomorrow.',
    'As quiet as possible, so nothing fatigues over the day': 'Very quiet listening makes everything read thin, so tone decisions lean the wrong way.',
  },
  m3: {
    'The reference, because they take the room and its modes out of the picture': 'Headphones remove the room but also change how bass, width and level are heard. They check a decision.',
    'Never used — a mastering room has monitors for a reason': 'They are useful: detail, clicks and edits show up well on them.',
  },
  m4: {
    'After the monitor controller, where the level is already set': 'The controller sets the level of something that is already playing. What plays it?',
    'Between the power amplifier and the speakers, before the air': 'Only speaker cable sits there. The file has to be read and converted long before.',
  },
  m5: {
    'The converter, or the clocking between the converter and the DAW': 'Converter faults sound like clicks or distortion, not like bass that changes as you move your head.',
    'The DAW\'s sample rate and buffer size': 'Those settings change timing and the top end of what can be recorded, not how bass behaves in a room.',
  },

  // ── Module 4 · Choose a tool for the job (eight options) ─────────────────
  k1: toolCard('Broad EQ (shelf or tilt)', {
    'Narrow corrective EQ': 'The lean is across the whole song, not one ringing frequency. A narrow cut is too small a brush.',
    'Level trim + loudness meter': 'Turning it up makes it louder, not less dull. The tone stays the same.',
  }),
  k2: toolCard('Level trim + loudness meter', {
    'Gentle compression': 'The song is fine inside; only its level differs. Compression would change its shape too.',
    'Peak limiter': 'A limiter can make it louder, but it squeezes the peaks to do it. The song only needs level.',
  }),
  k3: toolCard('Peak limiter', {
    'Gentle compression': 'Compression works on the whole song. The problem is one moment in the bridge.',
    'Level trim + loudness meter': 'Turning the whole song down to suit one peak costs every other moment.',
  }),
  k4: toolCard('Narrow corrective EQ', {
    'Broad EQ (shelf or tilt)': 'A broad move changes everything near the ring. The problem sits at one frequency.',
  }),
  k5: toolCard('Phase correlation / mono check', {
    'Stereo width / M-S tool': 'Changing the width before you know what a phone does to it is guessing.',
  }),
  k6: toolCard('Gentle compression', {
    'Peak limiter': 'A limiter catches the highest peaks only. The song feels loose everywhere, not just at its peaks.',
  }),
  k7: toolCard('Listen on another system first', {
    'Broad EQ (shelf or tilt)': 'If the room is flattering the bass, any EQ you make here fixes the room, not the song.',
  }),

  // ── Module 5 · Workflow decisions ────────────────────────────────────────
  w1: {
    'Master the file as delivered, limiter and all': 'The limiter already squashed the peaks. Whatever you do next starts from a file with less room to work.',
    'Add a second limiter after the one on the bus': 'Limiting on top of limiting squeezes the dynamics twice. Look at what is already on the bus.',
  },
  w2: {
    'After a starting EQ is in place, so you hear the direction': 'Then your first impression is of your own EQ, not of the mix you were given.',
    'After loudness is set, so the level is representative': 'Setting loudness is a decision too. Decisions come after listening, not before it.',
  },
  w3: {
    'Add 1 dB more and see whether it keeps improving': 'More shelf is also more level, and louder sounds better. That test cannot tell tone from level.',
    'Move on — it sounded better, and that is the test': 'A shelf makes the file a little louder, and louder sounds better. Was it the tone, or the level?',
  },
  w4: {
    'Nothing — the DAW rendered them from the approved session': 'A render can still clip a fade, cut a tail or carry the wrong name. The session is not the file.',
    'Normalize them all to one loudness number': 'That undoes the level decisions made between songs, and it is still not a check of the files.',
  },
  w5: {
    'In the mix, by the mix engineer': 'A mix is one song. Which song comes first is a decision about the whole set.',
    'By the distributor, at upload': 'The distributor delivers what you send; the order is decided before.',
  },

  // ── Module 6 · Loudness decisions ────────────────────────────────────────
  l1: {
    'The sample-peak meter — it reads the actual samples in the file': 'It reads the samples, but a converter draws a smooth wave between them, and that wave can rise higher.',
    'Neither — two meters on one file disagree all the time': 'They measure two different things on purpose. Each is right about its own thing.',
  },
  l2: {
    'The loudest moment of the program, on a slow meter': 'That is a peak reading. Integrated loudness describes the whole piece, quiet parts included.',
    'The RMS of the left channel over the whole program': 'It uses both channels, weights the frequencies the way ears do, and leaves silent gaps out.',
  },
  l3: {
    'No — normalization undoes whatever the limiter did': 'Normalization only turns the volume up or down. Squashed peaks stay squashed.',
    'Only on CD, where nothing is normalized at all': 'On streaming the limiting is still in the file; normalization changes only how loud it plays.',
  },
  l4: {
    'One universal number everyone in the industry uses': 'A quiet piano piece and a dense rock song do not share a number, and destinations publish different ones.',
    'The limiter brand and the preset it shipped with': 'A preset is a starting point from a manufacturer, not the destination’s requirement.',
  },
  l5: {
    'Add bass to the master until the earbuds sound right': 'Then the master is mixed for earbuds and sounds heavy everywhere else.',
    'The master is wrong and goes back to the start': 'Earbuds always sound thinner than a full room. One small system does not overrule the reference.',
  },

  // ── Module 7 · Release decisions ─────────────────────────────────────────
  d1: {
    '24-bit, 48 kHz, stereo (the session format)': 'A CD player cannot play that format. The CD standard is fixed and older than the session.',
    'Whatever the DAW exports by default': 'Defaults differ between programs. The CD format is one fixed standard you look up.',
  },
  d2: {
    'From a number remembered from last year\'s delivery': 'Services change their guidance. Last year’s number may no longer be right.',
    'From the limiter preset named after the service': 'A preset name is a manufacturer’s guess, not the service’s own document.',
  },
  d3: {
    'Always fine — the lathe takes whatever the file holds': 'Vinyl has physical limits: very loud, very wide or very bright material can be hard to cut well.',
    'Impossible — vinyl needs a separate mix from the start': 'The same mix can be cut to vinyl; what changes is the master supplied for the cut.',
  },
  d4: {
    'Two limiter brands with different release curves': 'Look at the names again: they come from broadcast bodies, not equipment makers.',
    'Streaming services with their own normalization': 'They come from broadcasting: television and radio, not streaming services.',
  },
  d5: {
    'The distributor\'s problem, entered on their upload form': 'The distributor enters what you send. Wrong or missing data travels with the release.',
    'Optional on a WAV, since the file plays without it': 'The audio plays, but titles and codes are how the recording is identified and paid.',
  },

  // ── Module 8 · What can mastering address? ───────────────────────────────
  e1: {
    [MASTER]: 'A limiter is already on the bus, and “drive” has not been explained. Processing now is guessing.',
    [MIX]: 'Nothing is known to be wrong in the balance yet. First find out what the client means.',
  },
  e2: {
    [MIX]: 'The song’s mix is fine. The client wants it to stay quiet next to the others: a decision about the set.',
    [INFO]: 'The client has already said what they want: it stays quiet.',
  },
  e3: {
    [MASTER]: 'One voice in one chorus: a stereo master cannot lift it alone.',
    [INFO]: 'The singer has said exactly what they want, and where.',
  },
  e4: {
    [MIX]: 'Dull and narrow across the whole song: nothing points at one instrument.',
    [INFO]: 'The comparison with its neighbors already tells you what to listen for.',
  },
};

/** The shared line for a wrong option with no reason of its own. */
export const WHY_DEFAULT = 'Not that one. Look back at what this module showed you, then try another answer.';
