/**
 * The plucked-string lessons' SHARED checks and words — the items whose
 * reasoning is the same on every instrument of the family (hearing, power,
 * patterns, polarity versus delay, gain, a second channel, feedback, a clip
 * that marks a finish), written once with the instrument's own noun. Each
 * lesson adds its own instrument-specific items. Same item-writing rules as
 * the drum lessons (test/mikingLab4Guitars.test.ts): options of about the
 * same length, real misconceptions, a why for every wrong option, no brand.
 */
import type { DiagnosticItem, InstrumentModel, MikingScenario, OrderTask, Provenance, SetupReason, Symptom, VariantId, Wedge } from '../../../engine/model/types.ts';
import type { GuitarScene } from './guitarModel.ts';
import type { PlanObject } from './StagePlan';
export type Noun = { one: string; the: string; player: string };

export const HEARING_EXPLAIN = 'Max SPL says when the MIC distorts. Hearing risk depends on the level where a person is and for how long: a widely used guideline is no more than 85 dBA averaged over 8 hours, and every 3 dBA more halves the time.';

export function hearingCheck(p: string, n: Noun): MikingScenario {
  return {
    id: `${p}.set.1`,
    page: 'setting',
    prompt: `Your ${n.one} mic is rated to a very high maximum SPL. Do you still need a limit on how long the band rehearses at stage level near the wedges?`,
    options: ['No — anything below the mic’s rating is safe for the people near it', `No, as long as the mic is closer to the ${n.one} than you are`, 'Yes — a mic’s max SPL is a distortion limit, not a hearing limit'],
    correct: 'Yes — a mic’s max SPL is a distortion limit, not a hearing limit',
    explain: HEARING_EXPLAIN,
    why: {
      'No — anything below the mic’s rating is safe for the people near it': 'Max SPL tells you when the mic distorts, not what your ears can take. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      [`No, as long as the mic is closer to the ${n.one} than you are`]: 'A mic is not a hearing meter. Measure where the person listens, and keep levels, repeats and time down.',
    },
  };
}

export function hearingDiag(n: Noun): DiagnosticItem {
  return {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: `Your ${n.one} mic is rated to a very high maximum SPL. What does that tell you about a long, loud soundcheck?`,
    options: ['It is safe for as long as the stage stays below the mic’s rated level', 'Nothing — that is the mic’s distortion limit, not a hearing limit', `It is safe as long as the mic is nearer the ${n.one} than you`],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe for as long as the stage stays below the mic’s rated level': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      [`It is safe as long as the mic is nearer the ${n.one} than you`]: 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  };
}

/** The microphone page's generic checks: power, a clip's job, proximity. */
export function micChecks(p: string, n: Noun): MikingScenario[] {
  return [
    {
      id: `${p}.mic.2`,
      page: 'microphone',
      prompt: `What is a clip-on mini mic’s main advantage on a ${n.one}?`,
      options: ['It keeps the same distance as the player moves', 'It rejects the stage, so feedback stops mattering', 'It needs no power, so the spare input will do'],
      correct: 'It keeps the same distance as the player moves',
      explain: `Mounted on the ${n.one}, the capsule moves with it, so a moving player does not change the distance. It still hears a small local view, and it still needs power.`,
      why: {
        'It rejects the stage, so feedback stops mattering': 'A clip is a mount, not a pattern. Feedback still depends on levels, monitors and aim.',
        'It needs no power, so the spare input will do': 'A miniature condenser needs phantom power through its adapter.',
      },
    },
    {
      id: `${p}.mic.3`,
      page: 'microphone',
      prompt: 'The only spare input has no phantom power. Which of this page’s mics can you use?',
      options: ['The small condenser, if its cable run is short', 'The instrument dynamic: it needs no power', 'The clip-on mini, because it is so very small'],
      correct: 'The instrument dynamic: it needs no power',
      explain: 'Dynamic mics need no power. The small condenser and the clip-on mini are condensers: they need phantom power, whatever their size or cable.',
      why: {
        'The small condenser, if its cable run is short': 'Cable length does not power a condenser. Only the dynamic works without phantom.',
        'The clip-on mini, because it is so very small': 'Size does not change what it needs: a miniature condenser needs phantom too.',
      },
    },
    {
      id: `${p}.mic.4`,
      page: 'microphone',
      prompt: `What tends to happen with a directional mic brought very close to the ${n.one}?`,
      options: ['It adds bass — the proximity effect', 'It loses its bass, because it is so close up', 'It turns into an omni and hears all the way round'],
      correct: 'It adds bass — the proximity effect',
      explain: 'Very close, a directional mic’s low end rises — the proximity effect. Check a low passage before reaching for a filter.',
      why: {
        'It loses its bass, because it is so close up': 'The reverse: close in, a directional mic tends to gain bass.',
        'It turns into an omni and hears all the way round': 'Its pattern stays directional; what changes close in is its low end.',
      },
    },
  ];
}

/** The context page's generic checks: the wedge in the rejection, the supercardioid's null. */
export function contextChecks(p: string, n: Noun): MikingScenario[] {
  return [
    {
      id: `${p}.ctx.1`,
      page: 'context',
      prompt: `The floor wedge in front of the player is loud in the ${n.one} mic. What is a good first move to try?`,
      options: [`Turn the ${n.one} channel up so it covers the sound of the wedge`, `Move the mic a long way back from the ${n.one}`, 'Turn the mic so the wedge falls in its rejection'],
      correct: 'Turn the mic so the wedge falls in its rejection',
      explain: `Aim the pattern’s rejection at the wedge, by its actual pattern, while the mic still faces the ${n.one} and stays clear of the hands. Then judge what is left.`,
      why: {
        [`Turn the ${n.one} channel up so it covers the sound of the wedge`]: 'More gain raises the wedge in that channel too — and brings feedback closer.',
        [`Move the mic a long way back from the ${n.one}`]: `Farther away, the wedge gets relatively louder against the ${n.one}. Turn it or come closer instead.`,
      },
    },
    {
      id: `${p}.ctx.2`,
      page: 'context',
      prompt: `With a supercardioid on the ${n.one}, where should the wedge sit for the most rejection?`,
      options: ['Directly behind the mic, right on its rear axis', 'Beside the mic, square to the front of it', 'Toward the rear, off to one side of the axis'],
      correct: 'Toward the rear, off to one side of the axis',
      explain: 'A supercardioid’s deepest rejection is off the rear axis (near 125°); straight behind it has a small rear lobe. Aim by the actual pattern.',
      why: {
        'Directly behind the mic, right on its rear axis': 'Only a cardioid rejects most straight behind. A supercardioid has a small rear lobe there.',
        'Beside the mic, square to the front of it': 'At 90° the pickup is still fair. The rejection deepens toward the rear, off the axis.',
      },
    },
  ];
}

/** The two-mic page: timing, polarity, matched levels, a second mic's purpose. */
export function twoMicChecks(p: string, n: Noun): MikingScenario[] {
  return [
    {
      id: `${p}.two.1`,
      page: 'twoMic',
      prompt: `Two mics on one ${n.one} sound hollow together in mono. Why?`,
      options: [`The ${n.one} reaches them at different times, so some pitches cancel`, 'One of the two mics must be faulty, so it should be swapped for another', `Two mics on one ${n.one} cancel each other out completely`],
      correct: `The ${n.one} reaches them at different times, so some pitches cancel`,
      explain: `Each mic hears the ${n.one} from its own distance. Summed, the time difference makes a comb: some pitches add, some cancel — hollow. Move or rebalance a mic, then listen again.`,
      why: {
        'One of the two mics must be faulty, so it should be swapped for another': 'Two good mics at different distances do this. It is timing, not a fault.',
        [`Two mics on one ${n.one} cancel each other out completely`]: 'They cancel only at some pitches (the comb’s notches), not completely.',
      },
    },
    {
      id: `${p}.two.2`,
      page: 'twoMic',
      prompt: 'You flip mic B’s polarity. What happens to the arrival-time difference?',
      options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so both of the arrivals now line up again', 'It doubles, because the inverted copy arrives even later'],
      correct: 'Nothing: polarity flips the sign; the delay stays the same',
      explain: 'Polarity reverses the signal’s sign; it does not remove a delay caused by sound reaching the mics at different times. The notches move; Δt does not.',
      why: {
        'It drops to zero, so both of the arrivals now line up again': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still where they were.',
        'It doubles, because the inverted copy arrives even later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
      },
    },
    {
      id: `${p}.two.3`,
      page: 'twoMic',
      prompt: 'With mic B inverted, the pair sounds fuller and reads 2 dB louder. What do you conclude?',
      options: ['Not yet: match the levels, then compare both states in mono', 'Inverted is the correct setting for a pair like this, so keep it', 'Normal polarity was wrong, because it was the quieter one'],
      correct: 'Not yet: match the levels, then compare both states in mono',
      explain: `A louder state sounds “better” at first. Match the levels, compare both states in mono with the song, and keep what keeps the ${n.one}’s body — the answer depends on where the mics are.`,
      why: {
        'Inverted is the correct setting for a pair like this, so keep it': 'No setting is right for every pair: it depends on the mic positions. Check it by ear.',
        'Normal polarity was wrong, because it was the quieter one': 'Quieter is not wrong. Match levels, then judge.',
      },
    },
    {
      id: `${p}.two.4`,
      page: 'twoMic',
      prompt: `When does a second ${n.one} mic earn its place?`,
      options: ['When it adds a defined tone or width and holds up in mono', 'Whenever the arrangement leaves a spare input on the desk', 'When the first mic cannot give enough level on its own'],
      correct: 'When it adds a defined tone or width and holds up in mono',
      explain: 'A good mono mic is often enough. A second earns its place with a stated purpose — and only if the pair still works in mono, with the player moving naturally.',
      why: {
        'Whenever the arrangement leaves a spare input on the desk': 'A spare input is not a reason. A second mic adds spill and a combining check.',
        'When the first mic cannot give enough level on its own': 'Level comes from gain and the fader, not from another mic.',
      },
    },
  ];
}

/** Practice: gain, the second channel, and three mixed cards. */
export function practiceChecks(p: string, n: Noun, refExample: { quote: string; right: string; wrong1: string; wrong2: string; explain: string }): MikingScenario[] {
  return [
    {
      id: `${p}.prac.gain`,
      page: 'practice',
      prompt: `The quiet passages sit well below the overload light, but the player’s strongest notes light it. What do you do?`,
      options: ['Pull the channel fader well down until the hard notes sound clean again', 'Ask the player to play much more softly once the show has started', 'Lower the input gain, or use a pad its manual allows, and re-check'],
      correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
      explain: 'Set input gain for the loudest passage the player intends, with headroom, and check that soft notes still sit above the noise. A lowered fader does not undo clipping at the input.',
      why: {
        'Pull the channel fader well down until the hard notes sound clean again': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
        'Ask the player to play much more softly once the show has started': 'Set gain for the playing they intend — not for a gentler soundcheck.',
      },
    },
    {
      id: `${p}.prac.3`,
      page: 'practice',
      prompt: `What would justify adding a second ${n.one} channel?`,
      options: ['One mic works alone, the second adds a stated tone, it holds in mono', 'Two channels give the mix engineer more options to work with later', `The ${n.one} needs more level in the final mix than a single mic can give`],
      correct: 'One mic works alone, the second adds a stated tone, it holds in mono',
      explain: 'Start with one coherent position. A second mic — another spot, a room, or a pickup — earns its place when its contribution is defined and the sum still works in mono.',
      why: {
        'Two channels give the mix engineer more options to work with later': 'More channels also add spill, a cable and a combining check. A second mic should earn its place.',
        [`The ${n.one} needs more level in the final mix than a single mic can give`]: 'Level comes from gain and the fader, not from another mic.',
      },
    },
    {
      id: `${p}.mix.1`,
      page: 'practice',
      prompt: `A starting point says “${refExample.quote}”. Where do you measure from?`,
      options: [refExample.right, refExample.wrong1, refExample.wrong2],
      correct: refExample.right,
      explain: refExample.explain,
      why: {
        [refExample.wrong1]: 'That is a different point. The same number from it puts the mic somewhere else.',
        [refExample.wrong2]: 'Distances are read from the front, from the point the starting point names.',
      },
    },
    {
      id: `${p}.mix.2`,
      page: 'practice',
      prompt: 'The wedge sits about 125° off a supercardioid’s front axis. What can you expect?',
      options: ['Strong rejection on paper; in reality less, and least in the lows', 'Silence from the wedge, because it sits right in the null', 'More wedge than straight behind it, which is where it rejects most'],
      correct: 'Strong rejection on paper; in reality less, and least in the lows',
      explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
      why: {
        'Silence from the wedge, because it sits right in the null': 'A null is infinitely deep only on paper. Real mics reject far less.',
        'More wedge than straight behind it, which is where it rejects most': 'Straight behind, a supercardioid has a small rear lobe; its deepest rejection is off the rear axis.',
      },
    },
    {
      id: `${p}.mix.3`,
      page: 'practice',
      prompt: `Two ${n.one} mics sound thin together. Which change removes the arrival-time difference itself?`,
      options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the two mics', 'Turning the quieter of the two mics up until both match'],
      correct: 'Moving a mic so the two paths are closer to equal',
      explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
      why: {
        'Flipping the polarity switch on one of the two mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
        'Turning the quieter of the two mics up until both match': 'Level changes the depth of the notches, not where they are or the delay behind them.',
      },
    },
  ];
}

/** Symptoms every string lesson shares: hollow in mono, feedback, a clip. */
export function sharedSymptoms(p: string, n: Noun): Symptom[] {
  return [
    {
      id: `${p}.sym.hollow`,
      observation: 'Two mics, or a mic and the pickup, turn hollow in mono',
      firstChecks: 'Are the paths interacting? Solo each, sum in mono, move or rebalance, then test polarity or delay.',
      options: ['Solo each, sum in mono, then move or rebalance a mic', 'Flip a polarity switch and leave it there for the show', 'Pan the two paths hard apart so that they do not mix'],
      correct: 'Solo each, sum in mono, then move or rebalance a mic',
      explain: 'The comb comes from the timing between the paths. Changing a position fixes the cause; a switch is a test, not a cure. A pickup has its own timing and response, too.',
      why: {
        'Flip a polarity switch and leave it there for the show': 'Polarity moves the notches; it does not remove the delay. Check by ear.',
        'Pan the two paths hard apart so that they do not mix': 'They still mix in mono and in the room. Fix the timing.',
      },
    },
    {
      id: `${p}.sym.fb`,
      observation: 'Live feedback',
      firstChecks: 'Is a loudspeaker reaching the mic or the instrument? Lower the level, revise the geometry and open mics, or lean on the pickup.',
      options: ['Lower the level, then revise the geometry or lean on the pickup', 'Boost the channel, then cut the ringing pitch hard with EQ', `Move the mic much farther away so the ${n.one} sounds cleaner and more open`],
      correct: 'Lower the level, then revise the geometry or lean on the pickup',
      explain: 'Bring the level down first. Then bring a directional mic closer, aim its rejection at the wedge, close unused mics — or carry more on the pickup.',
      why: {
        'Boost the channel, then cut the ringing pitch hard with EQ': 'More gain is the wrong way. Lower it, then fix the geometry.',
        [`Move the mic much farther away so the ${n.one} sounds cleaner and more open`]: `Farther away, the ${n.one} is weaker against the stage: feedback comes sooner.`,
      },
    },
    {
      id: `${p}.sym.clip`,
      observation: `The mic clip marks the finish, or touches the player`,
      firstChecks: 'Stop; remove it with the player and use a compatible mount or a stand.',
      options: ['Stop, remove it with the player, and change the mount', 'Pad it with some tape and carry on to the end of the song', 'Tighten it a little further so that it stops moving'],
      correct: 'Stop, remove it with the player, and change the mount',
      explain: `A clip must suit the ${n.one}’s depth and finish, with the owner’s agreement. If it marks or rattles, stop and use a compatible mount or a stand.`,
      why: {
        'Pad it with some tape and carry on to the end of the song': 'Tape on a finish can damage it too. Stop and change the mount.',
        'Tighten it a little further so that it stops moving': 'Over-tightening is how finishes get marked. Remove it.',
      },
    },
  ];
}

/** The one-mic setup order, with the power and gain rules. */
export function setupOrder(p: string, n: Noun, placeStep: string): OrderTask {
  return {
    id: `${p}.prac.order`,
    page: 'practice',
    prompt: `Tap the steps of a one-mic ${n.one} setup in the order you would do them.`,
    steps: [
      { text: 'Ask the player: the part, the playing style, singing, movement, the sound wanted', early: `Start with the player and the ${n.one}.` },
      { text: 'Choose a mic whose pattern and power suit, and a secure stand or an approved clip', early: 'Choose the mic once you know the part and the room.' },
      { text: placeStep, early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is placed and connected — with the outputs muted first.' },
      { text: 'Set input gain on the loudest passage, with headroom; check soft notes', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare a few positions, one change at a time, at matched levels', early: 'Compare only once the level is set safely — and at matched levels, so louder does not win.' },
      { text: 'Secure the stand and cable; recheck the whole performance and movement', early: 'Secure it last, then watch the whole performance again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it for the loudest passage with headroom, and check the softest notes sit above the noise.',
  };
}

export const POWER_REASON: SetupReason = { id: 'r.power', label: 'This input gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
export const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point for this kind of mic, from the right point', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
export const clearReason = (what: string): SetupReason => ({ id: 'r.clear', label: `The mic, mount and cable stay clear of ${what}`, role: 'required', feedback: 'Clearance is part of every passing setup.' });
export const brandReason = (n: Noun): SetupReason => ({ id: 'r.brand', label: `It is the brand most engineers reach for on ${n.one}s`, role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' });
export const LOUD_REASON: SetupReason = { id: 'r.loud', label: 'It will give the loudest sound of any position', role: 'wrong', feedback: 'Loudness is not a passing reason — level comes from gain — and the loudest spot is often the least balanced.' };

export const STRINGS_PREDICT = {
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  context: { prompt: 'Where will this supercardioid reject the floor wedge best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
} as const;

export const ACCURACY = (n: Noun, picture: string) =>
  `ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every ${n.one}, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: ${picture}, a player whose reach is drawn roughly, mic patterns and the two-mic comb as textbook shapes, and string and top motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.`;

const STAGE: Provenance = { kind: 'illustrative', reason: 'a typical small stage; no source gives the positions' };

/** The stage sources every string lesson uses (lesson frame): a floor wedge
 *  downstage facing the player, and — when the player sings — their voice. */
export function stringsWedges(sc: GuitarScene, n: Noun, opts: { wedgeZ?: number; wedgeX?: number; voice?: boolean } = {}): Wedge[] {
  const lap = sc.o.lap;
  // The audience side is +z in both postures (lap: z = the guitar's y, the
  // treble edge faces away from the player).
  const out: Wedge[] = [
    {
      id: 'wedge',
      label: 'the player’s floor wedge, downstage, facing the player',
      short: 'WEDGE',
      p: { x: opts.wedgeX ?? 120, y: sc.floorY, z: opts.wedgeZ ?? 1200 },
      lift: 150,
      faces: { x: 0, y: 0, z: -1 },
      note: `In front of the player on the floor, facing back at them. A mic aimed at the ${n.one} has it ${lap ? 'out in front and below' : 'behind and below'} — where a pattern’s rejection can help.`,
      prov: STAGE,
    },
  ];
  if (opts.voice !== false) {
    const m = sc.o.P(sc.fit.mouth);
    out.push({
      id: 'voice',
      label: 'the player’s own voice (a singing player)',
      short: 'VOICE',
      p: m,
      lift: 0,
      faces: { x: 0, y: 0, z: 1 },
      note: `Just above and behind the ${n.one} mic’s front: in the front half of any pattern aimed at the ${n.one}, so no null reaches it. Plan the balance instead.`,
      prov: STAGE,
      glyph: 'none',
    });
  }
  return out;
}

/** The body's collision slices of one variant (the context page's "in path"). */
export function bodyShield(model: InstrumentModel, v: VariantId): string[] {
  return model.parts.filter((p) => p.variants?.includes(v) && /\.body\d+$/.test(p.id)).map((p) => p.id);
}

/** A typical plan round a string player (lesson frame x, z). */
export function stringsPlan(sc: GuitarScene, opts: { chair: boolean; vocal: boolean; di: boolean; shared?: boolean }): PlanObject[] {
  const lap = sc.o.lap;
  const head = sc.o.P(sc.fit.head.c);
  const m = sc.o.P(sc.fit.mouth);
  const out: PlanObject[] = [{ id: 'player', kind: 'player', at: { x: head.x, z: head.z }, scene: 'all', r: 320 }];
  if (opts.chair) out.push({ id: 'chair', kind: 'chair', at: { x: head.x, z: head.z - (lap ? 120 : 40) }, scene: 'kit', r: 220 });
  if (opts.vocal) out.push({ id: 'vocal', kind: 'vocal', at: { x: m.x, z: m.z + 90 }, faces: { x: m.x - 60, z: 520 }, scene: 'kit', r: 140 });
  if (opts.di) out.push({ id: 'di', kind: 'di', at: { x: sc.g.tail - 300, z: 260 }, scene: 'kit', r: 120 });
  if (opts.shared) out.push({ id: 'shared', kind: 'shared', at: { x: 300, z: 900 }, scene: 'stage', r: 160 });
  out.push(
    { id: 'bassAmp', kind: 'bassAmp', at: { x: 1500, z: -1250 }, scene: 'stage', r: 330 },
    { id: 'kit', kind: 'kit', at: { x: -900, z: -1700 }, scene: 'stage', r: 800 },
    { id: 'paL', kind: 'pa', at: { x: -2000, z: 1950 }, scene: 'stage', r: 300 },
    { id: 'paR', kind: 'pa', at: { x: 2100, z: 1950 }, scene: 'stage', r: 300 },
    { id: 'audience', kind: 'audience', at: { x: 0, z: 1650 }, scene: 'stage', r: 300 },
    { id: 'room', kind: 'room', at: { x: -2100, z: -2250 }, scene: 'studio', r: 300 },
  );
  return out;
}

/** The family's words on the shared pages (copy.words), with the noun. */
export function familyWords(n: Noun): import('../../../engine/model/copy.ts').FamilyWords {
  return {
    instrument: n.one,
    player: n.player,
    reference: 'point',
    inside: 'inside the body',
    outside: `in front of the ${n.one}`,
    axis: 'the line to the point it is measured from',
    facing: `facing the ${n.one}`,
    shield: `${n.one} in path`,
    mountStand: 'Mount: a stand and boom, kept out of both hands, the neck’s path and the player’s view',
    mountClip: `Mount: a clip made for this ${n.one}’s depth and edge — only with the owner’s OK`,
    sheet: `For a real ${n.one}, with the player’s agreement and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.`,
    viewSide: 'Front view',
    viewTop: 'View from above',
  };
}
