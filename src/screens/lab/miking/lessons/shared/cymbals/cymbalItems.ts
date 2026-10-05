/**
 * THE CYMBAL LESSONS' SHARED ITEMS — the checks, symptoms, setup steps and
 * reasons that read the same for every cymbal (hearing, power, polarity and
 * delay, gain, spill, the overheads), worded for the lesson's own cymbal.
 * Each lesson adds its own instrument-specific items beside these.
 *
 * Item-writing rules (LESSON_JOURNEY §5, test/_mikingItemRules.ts): the
 * correct option is never conspicuously longer, wrong options are real
 * misconceptions without "always / any / never / every", every wrong option
 * has its own why, and no option asks for a brand. Starting-points voice
 * (owner ruling 2026-10-04): no source, brand or model names.
 */
import type { DiagnosticItem, MikingScenario, OrderTask, SetupReason, Symptom } from '../../../engine/model/types.ts';
import { micRatingCheck } from '../../../engine/model/sharedItems.ts';

/** The words an item needs: "hi-hat", "the hi-hats", "a hi-hat mic". */
export type CymWords = { pfx: string; one: string; the: string; mic: string };

export const HEARING_EXPLAIN = 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens. Cymbals are among the loudest things on a stage: keep soundcheck short and use hearing protection.';

/** THE SETTING: a mic's max SPL is not a hearing limit. */
export function hearingCheck(w: CymWords): MikingScenario {
  // The shared max-SPL check (sharedItems.ts): what the rating DOES say,
  // with the cymbals' own hearing note added to its explanation.
  const c = micRatingCheck({ id: `${w.pfx}.set.hear`, page: 'setting', mic: w.mic, loudest: `the hardest hit on ${w.the}` });
  return { ...c, explain: `${c.explain} Cymbals are among the loudest things on a stage: keep soundcheck short and use hearing protection.` };
}

/** THE QUICK CHECK's critical item (hearing). */
export function hearingDiagnostic(w: CymWords): DiagnosticItem {
  return {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: `Your ${w.mic} is rated to a very high maximum SPL. What does that tell you about standing beside ${w.the} through a long soundcheck?`,
    options: ['Nothing — it is the mic’s distortion limit, not a hearing limit', 'It is safe for as long as the cymbals stay below the mic’s rating', 'It is safe as long as the mic is nearer the cymbal than you'],
    correct: 'Nothing — it is the mic’s distortion limit, not a hearing limit',
    explain: HEARING_EXPLAIN,
    why: {
      'It is safe for as long as the cymbals stay below the mic’s rating': 'The rating says when the mic distorts. Hearing risk depends on the level where you are, and for how long.',
      'It is safe as long as the mic is nearer the cymbal than you': 'Where the mic is says nothing about your ears. Measure where the person listens.',
    },
  };
}

/** MICROPHONES: no phantom on the spare input. */
export function powerCheck(w: CymWords, dynamicWord: string): MikingScenario {
  return {
    id: `${w.pfx}.mic.power`,
    page: 'microphone',
    prompt: `The only spare input has no phantom power. Which of this page’s mic types can go on ${w.the}?`,
    options: [`Only ${dynamicWord}: it needs no power`, 'The small condensers, if the cable run is short', 'The clip-on condenser, because it is so small'],
    correct: `Only ${dynamicWord}: it needs no power`,
    explain: 'A dynamic mic needs no power. Every condenser here needs phantom power, whatever its size or cable length — check the input before you choose.',
    why: {
      'The small condensers, if the cable run is short': 'Cable length does not power a condenser. It needs phantom power from the desk.',
      'The clip-on condenser, because it is so small': 'Its size does not change what it needs: a condenser needs phantom power.',
    },
  };
}

/** MICROPHONES: spill is not a transducer property. */
export function spillCheck(w: CymWords, neighbour: string): MikingScenario {
  return {
    id: `${w.pfx}.mic.spill`,
    page: 'microphone',
    prompt: `A friend says condensers on ${w.the} pick up more of ${neighbour} than dynamics do. What is a better way to think about it?`,
    options: ['Spill depends on the mic’s pattern, its aim and its distance', 'They are right: a condenser hears everything going on around it', 'They are wrong: a condenser hears only what it points at'],
    correct: 'Spill depends on the mic’s pattern, its aim and its distance',
    explain: 'How much of a neighbour a mic hears depends on where its pattern points, how far each source is, how loud they are and how the real pattern behaves off axis — not on the transducer type alone.',
    why: {
      'They are right: a condenser hears everything going on around it': 'A cardioid condenser rejects the rear like a cardioid dynamic does. Pattern, aim and distance set the spill.',
      'They are wrong: a condenser hears only what it points at': 'Every mic hears some of what is around it; how much depends on its pattern, aim and distance.',
    },
  };
}

/** TWO MICROPHONES: polarity is not delay. */
export function polarityCheck(w: CymWords): MikingScenario {
  return {
    id: `${w.pfx}.two.pol`,
    page: 'twoMic',
    prompt: `Your close ${w.one} mic and the overheads hear the same stroke at different times. What does the polarity switch on one of them do?`,
    options: ['Flips that signal’s sign; the time difference stays as it was', 'Removes the time difference, so the two mics arrive together exactly', 'Moves the mic electrically closer to the other one'],
    correct: 'Flips that signal’s sign; the time difference stays as it was',
    explain: 'Polarity inverts a signal; it does not move it in time. It can make one notch pattern better and another worse — compare both states in mono, at matched levels, and move a mic when the delay is the problem.',
    why: {
      'Removes the time difference, so the two mics arrive together exactly': 'Only distance (or a delay setting) changes when a sound arrives. The switch only flips the sign.',
      'Moves the mic electrically closer to the other one': 'Nothing electrical moves a mic. The switch flips the signal; the arrival time is set by distance.',
    },
  };
}

/** TWO MICROPHONES: the overheads first. */
export function overheadsFirst(w: CymWords): MikingScenario {
  return {
    id: `${w.pfx}.two.oh`,
    page: 'twoMic',
    prompt: `With a close ${w.one} mic AND the overheads up, ${w.the} sound thin and phasey in mono. What is a good first check?`,
    options: ['Each mic alone, then both, in mono, both polarity states', 'Boost the high end of the close mic until it cuts through', 'Mute the overheads, since they are the cause of the trouble'],
    correct: 'Each mic alone, then both, in mono, both polarity states',
    explain: 'Two mics hearing one cymbal at different times can cancel some frequencies. Hear each alone, then together in mono at matched levels; flip polarity both ways; move a mic or leave one out if it still thins.',
    why: {
      'Boost the high end of the close mic until it cuts through': 'EQ cannot undo a cancellation between two mics. Check the pair in mono first.',
      'Mute the overheads, since they are the cause of the trouble': 'The overheads usually carry the whole kit. Find the cause before you lose them.',
    },
  };
}

/** PRACTICE: gain on the loudest stroke. */
export function gainCheck(w: CymWords, loudest: string): MikingScenario {
  return {
    id: `${w.pfx}.prac.gain`,
    page: 'practice',
    prompt: `You set the ${w.one} channel’s input gain on soft time-keeping. Then the player hits ${loudest}. What do you expect?`,
    options: ['It may clip — set gain on the loudest strokes, with headroom', 'Nothing changes: a cymbal’s level stays steady through a song', 'The mic protects itself by turning its own sensitivity down'],
    correct: 'It may clip — set gain on the loudest strokes, with headroom',
    explain: 'Cymbals swing from quiet time-keeping to loud accents. Set gain while the player plays the loudest parts, and leave headroom.',
    why: {
      'Nothing changes: a cymbal’s level stays steady through a song': 'Accents and crashes are far louder than time-keeping. The level moves a lot.',
      'The mic protects itself by turning its own sensitivity down': 'A mic does not adjust itself. Set the input gain for the loudest moments.',
    },
  };
}

/** The setup in order (the kick's sequence, worded for a cymbal). */
export function orderTask(w: CymWords): OrderTask {
  return {
    id: `${w.pfx}.prac.order`,
    page: 'practice',
    prompt: `Tap the steps of a ${w.one} mic setup in the order you would do them.`,
    steps: [
      { text: `Ask the player how ${w.the} should sound; listen with the overheads up`, early: 'Start with the player and with what the kit already gives.' },
      { text: 'Choose the mic and a recommended starting point', early: 'Choose once you know what is missing.' },
      { text: 'Have the player stop; mount the mic clear of the stick, the swing and the player', early: 'You need a mic and a place before you mount it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom where it is needed', early: 'Power comes after the mic is mounted and connected — with the outputs muted first.' },
      { text: 'Set input gain on the loudest strokes, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare positions one change at a time; then with the overheads, in mono', early: 'Compare only once levels are set safely.' },
      { text: 'Secure the stand and cable; recheck with the player playing hard', early: 'Secure it last, then watch the whole motion again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it with headroom for the hardest strokes.',
  };
}

export const POWER_REASON: SetupReason = { id: 'r.power', label: 'Each mic gets the power it needs (phantom, or none)', role: 'required', feedback: 'Say how each mic is powered: a condenser needs phantom; a dynamic needs none.' };
export const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'Mic, stand and cable stay clear of the stick, the swing and the player', role: 'required', feedback: 'Clearance is part of every passing setup.' };
export const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand of cymbal mic most engineers use', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
export function docReason(w: CymWords): SetupReason {
  return { id: 'r.doc', label: `The mic starts at a recommended starting point, measured from ${w.the}`, role: 'required', feedback: 'Say why the position is a good place to begin, and what it is measured from.' };
}
export function nameReason(w: CymWords): SetupReason {
  return { id: 'r.name', label: `Every ${w.one} needs its own close mic, whatever the music`, role: 'wrong', feedback: 'Often the overheads carry the cymbals well. A close mic is a choice for what the music needs, not a rule.' };
}

/** Six symptoms → first checks, worded for the cymbal. */
export function symptoms(w: CymWords, o: { neighbour: string; air?: boolean }): Symptom[] {
  return [
    {
      id: `${w.pfx}.sym.contact`,
      observation: 'The stick, the cymbal or the player can reach the mic or its stand',
      firstChecks: 'Stop playing; move or remount, then recheck the whole motion with the player.',
      options: ['Stop the player, move or remount it, recheck the whole motion', 'Keep playing gently, and move it after the song has finished', 'Tape the mic stand to the cymbal stand so that it cannot shift about'],
      correct: 'Stop the player, move or remount it, recheck the whole motion',
      explain: 'Clearance comes first: stop before any mic moves, then check every stroke, the swing and the player’s arms.',
      why: {
        'Keep playing gently, and move it after the song has finished': 'A struck mic or a cymbal that hits a stand is a safety and damage risk now, not after the song.',
        'Tape the mic stand to the cymbal stand so that it cannot shift about': 'Joined stands pass every vibration to the mic, and the cymbal still swings into it. Move it clear instead.',
      },
    },
    {
      id: `${w.pfx}.sym.spill`,
      observation: `Too much of ${o.neighbour} in the ${w.one} channel`,
      firstChecks: 'Check the aim, the distance and the actual pattern; decide how much spill belongs in the kit sound.',
      options: ['Aim, distance and the actual pattern — then how much is fine', 'Turn the channel up until the cymbal itself covers up the spill', 'Swap to a condenser, which hears less of the drums'],
      correct: 'Aim, distance and the actual pattern — then how much is fine',
      explain: 'Point the mic’s rejection where it helps, from a safe position, and decide how much of the kit belongs in a cymbal channel — some always will.',
      why: {
        'Turn the channel up until the cymbal itself covers up the spill': 'More gain raises the spill as much as the cymbal. Aim and distance first.',
        'Swap to a condenser, which hears less of the drums': 'The transducer type does not decide spill. The pattern, aim and distance do.',
      },
    },
    {
      id: `${w.pfx}.sym.thin`,
      observation: `${w.the[0].toUpperCase()}${w.the.slice(1)} sound thin or phasey with the overheads`,
      firstChecks: 'Compare in mono with both polarity states, then move a mic; a switch does not cure every case.',
      options: ['Mono, both polarity states, then position and timing', 'Boost the top end on the close channel to cut through', 'Mute the overheads, since they cause the problem'],
      correct: 'Mono, both polarity states, then position and timing',
      explain: 'Two mics hearing one cymbal at different times can cancel. Compare in mono at matched levels; no switch cures every case.',
      why: {
        'Boost the top end on the close channel to cut through': 'EQ cannot undo a cancellation. Check the pair first.',
        'Mute the overheads, since they cause the problem': 'The overheads usually carry the whole kit. Find the cause first.',
      },
    },
    o.air
      ? {
          id: `${w.pfx}.sym.air`,
          observation: 'A low thump or wind noise each time the pair closes',
          firstChecks: 'Move the mic out of the air that rushes from the edges; a high-pass filter only after.',
          options: ['Move the mic out of the air that leaves the edges', 'Turn the bass up so the thump blends into the kit', 'Ask the player to close the pedal more slowly all night'],
          correct: 'Move the mic out of the air that leaves the edges',
          explain: 'When the pair closes, air rushes out sideways from between the edges. Move the mic up or round from the edge; a high-pass filter helps after, not instead.',
          why: {
            'Turn the bass up so the thump blends into the kit': 'That makes the thump louder. Move the mic out of the air first.',
            'Ask the player to close the pedal more slowly all night': 'The player plays the music. Move the mic, not the performance.',
          },
        }
      : {
          id: `${w.pfx}.sym.swing`,
          observation: 'The level swells and dips as the cymbal sways after a stroke',
          firstChecks: 'Move the mic farther from the plate so its swing changes the distance less.',
          options: ['Move the mic farther, so the swing matters less', 'Clamp the cymbal down tight so that it cannot move about', 'Add a compressor to even out the swells'],
          correct: 'Move the mic farther, so the swing matters less',
          explain: 'A struck cymbal rocks on its felts: very close, that motion changes the distance a lot. A little farther, it changes it much less.',
          why: {
            'Clamp the cymbal down tight so that it cannot move about': 'A cymbal must move freely on its felts — over-tightening chokes it and can crack it.',
            'Add a compressor to even out the swells': 'That treats the symptom. The swing near the mic is the cause.',
          },
        },
    {
      id: `${w.pfx}.sym.harsh`,
      observation: 'Harsh and brittle, nothing like it sounds in the room',
      firstChecks: 'Check distance and aim first — very close and on axis is a different sound; then the mic and the gain.',
      options: ['Distance and aim first — then the mic and the gain', 'Cut the treble hard on the channel and leave the mic', 'Ask for a darker cymbal before trying anything else'],
      correct: 'Distance and aim first — then the mic and the gain',
      explain: 'Very close and aimed straight at the plate, a mic hears a narrow, bright part of a big radiating surface. Move it back or turn it, one change at a time, and listen.',
      why: {
        'Cut the treble hard on the channel and leave the mic': 'EQ after a poor position rarely sounds like the cymbal. Fix the position first.',
        'Ask for a darker cymbal before trying anything else': 'The player’s cymbal is the sound they chose. Move the mic first.',
      },
    },
    {
      id: `${w.pfx}.sym.dist`,
      observation: 'Loud strokes distort',
      firstChecks: 'Find where it starts — the mic, the input, or something rattling — then the gain.',
      options: ['Where it starts — mic, input or hardware — then gain', 'Pull the channel fader down until the hits sound cleaner', 'Cut the low end with EQ to make more headroom'],
      correct: 'Where it starts — mic, input or hardware — then gain',
      explain: 'A lowered fader does not undo clipping at the input, and EQ after an overloaded input cannot restore it. Find where it starts.',
      why: {
        'Pull the channel fader down until the hits sound cleaner': 'The fader comes after the input. Clipping there stays clipped.',
        'Cut the low end with EQ to make more headroom': 'EQ after the input cannot repair a clipped signal.',
      },
    },
  ];
}
