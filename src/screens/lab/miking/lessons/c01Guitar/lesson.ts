/**
 * C01 ACOUSTIC GUITAR — the lesson's pages as DATA (blueprint §7). The words
 * come from the owner's lesson (docs/labs/miking/source_text/Acoustic-Guitar-
 * Miking-Technique.txt, cited "L<n>" in COMMENTS only) with the fixes logged
 * in docs/labs/miking/CORRECTIONS_LOG.md (AG-01 …) applied.
 *
 * OWNER RULING 2026-10-04 — learner-facing presentation: suggested starting
 * points, never dogma; no source, brand or model in learner text; no badges.
 * FULLY SILENT. Pinned by test/mikingLearnerText.test.ts and
 * test/mikingLab4Guitars.test.ts.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { micRatingCheck } from '../../engine/model/sharedItems.ts';
import { C01_MODEL, C01_WEDGES, C01_ZONES } from './geometry.ts';
import { C01_COPY } from './copy.ts';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the acoustic guitar',
    goal: 'Get to know the acoustic guitar — steel-string, twelve-string and nylon-string — what it is, where you meet it, what it does in the music, and its parts, before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The strings drive the bridge, the bridge drives the top, and the top and the air in the body make most of the sound. Where the neck meets the body differs: the 14th fret on these steel-string bodies, the 12th on the nylon.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a pluck becomes sound — the string, the bridge, the top and the air in the body — and where the sound leaves the guitar. Shown, never played.',
    credit: { scenarios: ['ag.snd.1', 'ag.snd.2', 'ag.snd.3'], interactive: 'soundPath', note: 'Step the pluck through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A string on its own moves little air: the top, driven through the bridge, does most of the work, and the air in the body breathes through the sound hole. Where you pluck changes the mix of shapes; where you put a mic changes which part you hear.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the space round a guitarist — the strumming arm, the fretting hand, their voice and their view of the neck — what a stage and a studio add, and what to do before any mic.',
    credit: { scenarios: ['ag.set.1', 'ag.set.2', 'ag.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The space round the guitar is the player’s: the arm, the hand, the neck and their sight line. A singing player is a second source right above the guitar. Ask the player first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the acoustic guitar by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['ag.mic.1', 'ag.mic.2', 'ag.mic.3', 'ag.mic.4', 'ag.rec.1'], note: 'Answer the five checks (one reaches back to how the guitar sounds).' },
    takeaway: 'Pattern, power, size and mount decide what a mic can do here. A small condenser is a common choice in a quiet room; a dynamic is a robust close option; a clip-on mini moves with the guitar. A mic’s maximum SPL is not a hearing limit.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — near the 12th fret, measured from the point the starting point names, clear of the hands — then move the mic and see what changes.',
    credit: { scenarios: ['ag.place.1', 'ag.place.2', 'ag.place.3', 'ag.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named point — the 12th fret, the sound hole, the bridge — not a rule. Distance, position and angle are separate things to try, and the player’s clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the floor wedge — and know what a pattern cannot do, from a singing player to the top’s reflections.',
    credit: { scenarios: ['ag.ctx.1', 'ag.ctx.2', 'ag.ctx.studio', 'ag.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'A cardioid rejects most behind; a supercardioid off to each side of the rear. Real nulls are shallower than the picture, the top reflects stage sound, and a voice above the guitar is in front of any guitar mic. No mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two microphones',
    goal: 'See why two mics on one guitar can sound hollow together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['ag.two.1', 'ag.two.2', 'ag.two.3', 'ag.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two mics hear the guitar at different times, so their sum combs. Polarity flips the sign; it does not remove a delay. Start with one good mic, add a second only for a stated purpose, and judge the pair in mono at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — position, aim, the pattern, the player’s movement, gain staging, levels and polarity — and the guitar itself, before reaching for tone controls.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one guitar mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['ag.prac.order', 'ag.prac.gain', 'ag.prac.setup1', 'ag.prac.setup2', 'ag.prac.3', 'ag.mix.1', 'ag.mix.2', 'ag.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real guitar.' },
    takeaway: 'Safe clearance from the player, correct power and level checks, pattern reasoning and an honest account of polarity versus delay pass. A brand or a “loudest” position do not — and more than one setup can pass.',
  },
};

/*
 * THE CHECKS. Every item tests reasoning; every wrong option is a real
 * misconception of about the same length, with its own explanation. Lesson
 * lines in comments only: ag.snd.* L5 · ag.set.* L6, safety · ag.mic.* L27 ·
 * ag.place.* L14-L19, L21 · ag.ctx.* L42-L44 · ag.two.* L38-L39 · ag.prac.*
 * L27, L67-L72.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'ag.snd.1',
    page: 'sound',
    prompt: 'Where does most of an acoustic guitar’s sound leave from?',
    options: ['The top and the sound hole, driven through the bridge', 'The strings themselves, straight out into the whole room', 'The headstock and tuners, where the strings end'],
    correct: 'The top and the sound hole, driven through the bridge',
    explain: 'A thin string moves very little air on its own. It rocks the bridge, the bridge drives the top, and the top and the air breathing through the hole radiate most of the sound.',
    why: {
      'The strings themselves, straight out into the whole room': 'Strings are too thin to move much air. They drive the bridge and the top, which do.',
      'The headstock and tuners, where the strings end': 'The headstock holds the tuning. The sound is made by the top and the air in the body.',
    },
  },
  {
    id: 'ag.snd.2',
    page: 'sound',
    prompt: 'An open string is plucked exactly at its middle, over the 12th fret. Which of its shapes can that pluck set moving?',
    options: ['Only the odd ones; every even shape is still there', 'All of them equally, because the whole string moves', 'Only the even ones; the odd shapes are still there'],
    correct: 'Only the odd ones; every even shape is still there',
    explain: 'A pluck drives a shape only as much as the string moves at the pick in that shape. Every even shape has a still point at the exact middle, so a pluck there leaves them still.',
    why: {
      'All of them equally, because the whole string moves': 'The pick touches one spot. A shape is driven only as much as the string moves there — not at all at a still point.',
      'Only the even ones; the odd shapes are still there': 'The reverse: the even shapes have a still point at the middle; the odd ones move most there.',
    },
  },
  {
    id: 'ag.snd.3',
    page: 'sound',
    prompt: 'Why does a pluck close to the bridge tend to sound brighter?',
    options: ['It sets the upper shapes moving relatively more', 'It makes the vibrating string shorter, so it is higher', 'It moves the top less, so only the hole is heard'],
    correct: 'It sets the upper shapes moving relatively more',
    explain: 'Near the end of the string the upper shapes move almost as much as the lowest, so they start relatively stronger — a brighter balance. The pitch does not change: the string length is the same.',
    why: {
      'It makes the vibrating string shorter, so it is higher': 'Where you pluck does not change the vibrating length — only a fret does. It changes the mix of shapes.',
      'It moves the top less, so only the hole is heard': 'The bridge still drives the top. What changes is the balance of the string’s shapes.',
    },
  },
  micRatingCheck({ id: 'ag.set.1', page: 'setting', mic: 'guitar mic', loudest: 'the loudest strum' }),
  {
    id: 'ag.set.2',
    page: 'setting',
    prompt: 'Before you place a stand mic for a seated guitarist, what do you need from the player?',
    options: ['Their whole motion — strumming, fretting, singing, any movement', 'The guitar’s make, so you can look up its single correct position', 'Nothing: the 12th fret already marks where the mic goes'],
    correct: 'Their whole motion — strumming, fretting, singing, any movement',
    explain: 'A starting point is valid only where the player cannot hit the mic or lose sight of the neck. Watch the full performance — loud strums, position shifts, singing — before anything is tightened.',
    why: {
      'The guitar’s make, so you can look up its single correct position': 'No make sets a mic position. The player’s motion and the sound wanted do.',
      'Nothing: the 12th fret already marks where the mic goes': 'The 12th fret is one place to begin — and only where the player’s hands and view stay clear.',
    },
  },
  {
    id: 'ag.set.3',
    page: 'setting',
    prompt: 'The guitarist also sings. What else does the guitar mic hear?',
    options: ['Their voice, from just above and behind it', 'Nothing else, as long as it is close to the guitar', 'Only the PA, because it faces the audience'],
    correct: 'Their voice, from just above and behind it',
    explain: 'The mouth is a short way above the guitar, so the voice reaches the guitar mic — and the guitar reaches the vocal mic. Plan the balance of the two; no pattern removes the voice from a mic aimed at the guitar.',
    why: {
      'Nothing else, as long as it is close to the guitar': 'Closer helps the ratio, but the voice is right there: some of it always arrives. Plan for it.',
      'Only the PA, because it faces the audience': 'The PA faces away; the voice is the nearest other source, just above the guitar.',
    },
  },
  {
    id: 'ag.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic close to the sound hole hears more of which part of the sound?',
    options: ['The air in the body, breathing through the hole', 'The pick scraping on the strings close to the bridge', 'The tuners turning at the headstock'],
    correct: 'The air in the body, breathing through the hole',
    explain: 'The air inside the body moves in and out through the hole — a big part of the low end. Close to it, a mic hears more of that: fuller, and boomy if too close.',
    why: {
      'The pick scraping on the strings close to the bridge': 'That is nearer the bridge. Over the hole, the body’s air dominates.',
      'The tuners turning at the headstock': 'The headstock is far from the hole and makes little sound of its own.',
    },
  },
  {
    id: 'ag.mic.1',
    page: 'microphone',
    prompt: 'When does an omni on the guitar make the most sense?',
    options: ['In a quiet, good room where its sound is welcome', 'On a loud stage, to keep all the monitors out of it', 'Very close, to get the most bass from proximity'],
    correct: 'In a quiet, good room where its sound is welcome',
    explain: 'An omni hears all round: a fuller, less position-sensitive view — and the room and any spill with it. Choose it when the room is worth hearing.',
    why: {
      'On a loud stage, to keep all the monitors out of it': 'An omni rejects nothing: on a loud stage it hears the monitors as well as the guitar.',
      'Very close, to get the most bass from proximity': 'Proximity effect belongs to directional mics. An omni shows little of it.',
    },
  },
  {
    id: 'ag.mic.2',
    page: 'microphone',
    prompt: 'What is a clip-on mini mic’s main advantage on a guitar?',
    options: ['It keeps the same distance as the player moves', 'It rejects the stage, so feedback stops mattering', 'It needs no power, so the spare input will do'],
    correct: 'It keeps the same distance as the player moves',
    explain: 'Mounted on the body, the capsule moves with the guitar, so a moving player does not change the distance. It still hears a small local view, and it still needs power.',
    why: {
      'It rejects the stage, so feedback stops mattering': 'A clip is a mount, not a pattern. Feedback still depends on levels, monitors and aim.',
      'It needs no power, so the spare input will do': 'A miniature condenser needs phantom power through its adapter.',
    },
  },
  {
    id: 'ag.mic.3',
    page: 'microphone',
    prompt: 'The only spare input has no phantom power. Which of this page’s mics can you use?',
    options: ['The instrument dynamic: it needs no power', 'The small condenser, if its cable run is short', 'The clip-on mini, because it is so small'],
    correct: 'The instrument dynamic: it needs no power',
    explain: 'Dynamic mics need no power. The small condenser and the clip-on mini are condensers: they need phantom power, whatever their size or cable.',
    why: {
      'The small condenser, if its cable run is short': 'Cable length does not power a condenser. Only the dynamic works without phantom.',
      'The clip-on mini, because it is so small': 'Size does not change what it needs: a miniature condenser needs phantom too.',
    },
  },
  {
    id: 'ag.mic.4',
    page: 'microphone',
    prompt: 'What tends to happen with a directional mic brought very close to the guitar?',
    options: ['It adds bass — the proximity effect', 'It loses its bass, because it is so close', 'It turns into an omni and hears all round'],
    correct: 'It adds bass — the proximity effect',
    explain: 'Very close, a directional mic’s low end rises — the proximity effect. Close to the hole that adds to the boom; check a low passage before reaching for a filter.',
    why: {
      'It loses its bass, because it is so close': 'The reverse: close in, a directional mic tends to gain bass.',
      'It turns into an omni and hears all round': 'Its pattern stays directional; what changes close in is its low end.',
    },
  },
  {
    id: 'ag.place.1',
    page: 'placement',
    prompt: 'A starting point says 15–30 cm from the 12th fret. Your readout says 20 cm out from the sound hole. Are you in it?',
    options: ['Not necessarily: it is read from the 12th fret, not the hole', 'Yes: 20 cm falls inside the 15 to 30 cm band', 'Yes, as long as the mic is pointed straight at the guitar’s top'],
    correct: 'Not necessarily: it is read from the 12th fret, not the hole',
    explain: 'A distance means something only with its reference point. The 12th fret and the sound hole are different places, so the same number puts the mic somewhere else — which is why every readout names what it measures from.',
    why: {
      'Yes: 20 cm falls inside the 15 to 30 cm band': 'Same number, different point. The band is measured from the 12th fret.',
      'Yes, as long as the mic is pointed straight at the guitar’s top': 'Aim is a separate check. The distance is read from the point the starting point names.',
    },
  },
  {
    id: 'ag.place.2',
    page: 'placement',
    prompt: 'You slide the mic from the 12th fret toward the sound hole, at the same distance. What tends to change?',
    options: ['More body and low end; listen for boom', 'More string detail and less low end', 'Only the level; the tone stays the same'],
    correct: 'More body and low end; listen for boom',
    explain: 'The hole is where the air in the body breathes: a mic facing it hears more body and low end — fuller, and boomy if too close. Compare at matched levels; guitars vary.',
    why: {
      'More string detail and less low end': 'That is the move toward the neck. The hole adds body.',
      'Only the level; the tone stays the same': 'Moving along the guitar changes the balance, not only the level.',
    },
  },
  {
    id: 'ag.place.3',
    page: 'placement',
    prompt: 'On a steel-string dreadnought, why are “the 12th fret” and “where the neck meets the body” different places?',
    options: ['Its neck meets the body at the 14th fret, a little farther in', 'They are just one and the same point on a steel-string dreadnought', 'The 12th fret sits right over its sound hole'],
    correct: 'Its neck meets the body at the 14th fret, a little farther in',
    explain: 'On these steel-string bodies the neck joins at the 14th fret, so the 12th fret is about 3.5 cm out on the neck. On a classical body the neck joins at the 12th: there, the two are the same.',
    why: {
      'They are just one and the same point on a steel-string dreadnought': 'They match on a 12-fret classical body. A dreadnought’s neck meets the body at the 14th fret.',
      'The 12th fret sits right over its sound hole': 'The 12th fret is on the neck, beyond the body; the hole is on the top.',
    },
  },
  {
    id: 'ag.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a stand mic and its boom stay out of, round a seated guitarist?',
    options: ['The strumming arm, the fretting hand and their view of the neck', 'The front of the guitar, so that the audience can see it clearly', 'The floor by the chair, which belongs to the DI box'],
    correct: 'The strumming arm, the fretting hand and their view of the neck',
    explain: 'Clearance comes first: the arm sweeps over the body, the hand travels the neck, and the player watches the neck. Stop the player before anything moves.',
    why: {
      'The front of the guitar, so that the audience can see it clearly': 'In front of the guitar is usually where the mic goes. The space to protect is the player’s.',
      'The floor by the chair, which belongs to the DI box': 'Cables need a safe route, but the safety question is the player’s arm, hand and view.',
    },
  },
  {
    id: 'ag.ctx.1',
    page: 'context',
    prompt: 'The floor wedge in front of the player is loud in the guitar mic. What is a good first move to try?',
    options: ['Turn the mic so the wedge falls in its rejection', 'Turn the guitar channel up so it covers the wedge', 'Move the mic farther away from the guitar'],
    correct: 'Turn the mic so the wedge falls in its rejection',
    explain: 'Aim the pattern’s rejection at the wedge, by its actual pattern, while the mic still faces the guitar and stays clear of the hands. Then judge what is left.',
    why: {
      'Turn the guitar channel up so it covers the wedge': 'More gain raises the wedge in that channel too — and brings feedback closer.',
      'Move the mic farther away from the guitar': 'Farther away, the wedge gets relatively louder. Come closer or turn it instead.',
    },
  },
  {
    id: 'ag.ctx.2',
    page: 'context',
    prompt: 'With a supercardioid on the guitar, where should the wedge sit for the most rejection?',
    options: ['Toward the rear, off to one side of the axis', 'Directly behind the mic, right on its rear axis', 'Beside the mic, square to its front'],
    correct: 'Toward the rear, off to one side of the axis',
    explain: 'A supercardioid’s deepest rejection is off the rear axis (near 125°); straight behind it has a small rear lobe. Aim by the actual pattern.',
    why: {
      'Directly behind the mic, right on its rear axis': 'Only a cardioid rejects most straight behind. A supercardioid has a small rear lobe there.',
      'Beside the mic, square to its front': 'At 90° the pickup is still fair. The rejection deepens toward the rear, off the axis.',
    },
  },
  {
    id: 'ag.ctx.studio',
    page: 'context',
    prompt: 'A studio session in a good room, the guitarist alone. What could justify moving the mic farther back?',
    options: ['A more natural blend of guitar and room, with no spill to fight', 'A farther mic hears less of the room than a close mic would hear', 'A farther mic needs no phantom power to work'],
    correct: 'A more natural blend of guitar and room, with no spill to fight',
    explain: 'Moving back integrates the whole instrument with the room, with less isolation. In a quiet good room with one player, that trade can be worth it — judge it by ear.',
    why: {
      'A farther mic hears less of the room than a close mic would hear': 'The reverse: farther back, the room is a bigger part of what the mic hears.',
      'A farther mic needs no phantom power to work': 'Distance does not change a mic’s power needs.',
    },
  },
  {
    id: 'ag.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · On a loud stage, the guitar’s top can also do what?',
    options: ['Reflect the PA and other instruments into the mic', 'Block the sound of anything behind the guitar', 'Turn the wedge’s sound into the guitar’s own'],
    correct: 'Reflect the PA and other instruments into the mic',
    explain: 'The top is a hard, broad surface right in front of the mic: stage sound bounces off it into the mic even when the mic is aimed away from that sound.',
    why: {
      'Block the sound of anything behind the guitar': 'The body is in the way of some sound, but it also bounces stage sound back toward the mic.',
      'Turn the wedge’s sound into the guitar’s own': 'A reflection is still the wedge’s sound, just arriving from the guitar’s direction.',
    },
  },
  {
    id: 'ag.two.1',
    page: 'twoMic',
    prompt: 'A neck-side mic and a bridge-side mic sound hollow together in mono. Why?',
    options: ['The guitar reaches them at different times, so some pitches cancel', 'One of the two mics must be faulty, so it should be swapped for another', 'Two mics on one guitar cancel each other out completely'],
    correct: 'The guitar reaches them at different times, so some pitches cancel',
    explain: 'Each mic hears the guitar from its own distance. Summed, the time difference makes a comb: some pitches add, some cancel — hollow. Move or rebalance a mic, then listen again.',
    why: {
      'One of the two mics must be faulty, so it should be swapped for another': 'Two good mics at different distances do this. It is timing, not a fault.',
      'Two mics on one guitar cancel each other out completely': 'They cancel only at some pitches (the comb’s notches), not completely.',
    },
  },
  {
    id: 'ag.two.2',
    page: 'twoMic',
    prompt: 'You flip mic B’s polarity. What happens to the arrival-time difference?',
    options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so both of the arrivals now line up again', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Polarity reverses the signal’s sign; it does not remove a delay caused by sound reaching the mics at different times. The notches move; Δt does not.',
    why: {
      'It drops to zero, so both of the arrivals now line up again': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still where they were.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  },
  {
    id: 'ag.two.3',
    page: 'twoMic',
    prompt: 'With mic B inverted, the pair sounds fuller and reads 2 dB louder. What do you conclude?',
    options: ['Not yet: match the levels, then compare both states in mono', 'Inverted is the correct setting for guitar pairs, so keep it', 'Normal polarity was wrong, because it was the quieter one'],
    correct: 'Not yet: match the levels, then compare both states in mono',
    explain: 'A louder state sounds “better” at first. Match the levels, compare both states in mono with the song, and keep what keeps the guitar’s body — the answer depends on where the mics are.',
    why: {
      'Inverted is the correct setting for guitar pairs, so keep it': 'No setting is right for every pair: it depends on the mic positions. Check it by ear.',
      'Normal polarity was wrong, because it was the quieter one': 'Quieter is not wrong. Match levels, then judge.',
    },
  },
  {
    id: 'ag.two.4',
    page: 'twoMic',
    prompt: 'When does a second guitar mic earn its place?',
    options: ['When it adds a defined tone or width and holds up in mono', 'Whenever the guitar is a twelve-string, for its extra strings', 'When the first mic cannot give enough level on its own'],
    correct: 'When it adds a defined tone or width and holds up in mono',
    explain: 'A good mono mic is often enough, especially in a busy arrangement. A second earns its place with a stated purpose — and only if the pair still works in mono.',
    why: {
      'Whenever the guitar is a twelve-string, for its extra strings': 'Twelve strings do not call for two mics. Balance the whole instrument in the song first.',
      'When the first mic cannot give enough level on its own': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'ag.prac.gain',
    page: 'practice',
    prompt: 'Soft fingerpicking sits well below the overload light, but the player’s hardest strums light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader well down until the hard strums sound clean', 'Ask the player to strum more softly during the show'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set input gain for the loudest passage the player intends, with headroom, and check that soft notes still sit above the noise. A lowered fader does not undo clipping at the input.',
    why: {
      'Pull the channel fader well down until the hard strums sound clean': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the player to strum more softly during the show': 'Set gain for the playing they intend — not for a gentler soundcheck.',
    },
  },
  {
    id: 'ag.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second guitar channel?',
    options: ['One mic works alone, the second adds a stated tone, it holds in mono', 'Two channels give the mix engineer more options to work with later', 'The guitar needs more level in the mix than one mic can give'],
    correct: 'One mic works alone, the second adds a stated tone, it holds in mono',
    explain: 'Start with one coherent position. A second mic — another spot, a room, or the pickup — earns its place when its contribution is defined and the sum still works in mono.',
    why: {
      'Two channels give the mix engineer more options to work with later': 'More channels also add spill, a cable and a combining check. A second mic should earn its place.',
      'The guitar needs more level in the mix than one mic can give': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'ag.mix.1',
    page: 'practice',
    prompt: 'A starting point says “4–8 in from the bridge”. Where do you measure from?',
    options: ['The bridge, not the sound hole or the 12th fret', 'The sound hole, since that is the loudest place', 'The guitar’s back, through the whole body'],
    correct: 'The bridge, not the sound hole or the 12th fret',
    explain: 'A distance belongs to the point it names: from the bridge, from the hole and from the 12th fret are different places for the same number.',
    why: {
      'The sound hole, since that is the loudest place': 'Loudness does not choose the reference. The starting point names the bridge.',
      'The guitar’s back, through the whole body': 'Distances are read from the front, from the named point on the top.',
    },
  },
  {
    id: 'ag.mix.2',
    page: 'practice',
    prompt: 'The wedge sits about 125° off a supercardioid’s front axis. What can you expect?',
    options: ['Strong rejection on paper; in reality less, and least in the lows', 'Silence from the wedge, because it sits in the null', 'More wedge than straight behind it, which is where it rejects most'],
    correct: 'Strong rejection on paper; in reality less, and least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — and the guitar’s top can reflect the wedge back in. Use the null to aim, not to promise silence.',
    why: {
      'Silence from the wedge, because it sits in the null': 'A null is infinitely deep only on paper. Real mics reject far less.',
      'More wedge than straight behind it, which is where it rejects most': 'Straight behind, a supercardioid has a small rear lobe; its deepest rejection is off the rear axis.',
    },
  },
  {
    id: 'ag.mix.3',
    page: 'practice',
    prompt: 'Two guitar mics sound thin together. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning the quieter mic up until both match'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the quieter mic up until both match': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'ag.sym.boom',
    observation: 'The guitar sounds boomy or boxy',
    firstChecks: 'Is the mic aimed into the sound hole, or too close with a directional pattern? Aim toward the neck joint or step back; compare.',
    options: ['Aim toward the neck joint or step back from the hole', 'Boost the treble until the boom is masked', 'Swap to a different mic with a larger diaphragm instead'],
    correct: 'Aim toward the neck joint or step back from the hole',
    explain: 'Close to the hole, the body’s air and the proximity effect pile up low end. Move first; filter only for a specific problem.',
    why: {
      'Boost the treble until the boom is masked': 'EQ hides the boom without removing it. Change the position first.',
      'Swap to a different mic with a larger diaphragm instead': 'A bigger diaphragm does not mean less boom. The position is the cause.',
    },
  },
  {
    id: 'ag.sym.thin',
    observation: 'The guitar sounds thin',
    firstChecks: 'Is the mic too far toward the neck, or off the top? Move toward the upper bout or the hole a little at a time; check in the mix.',
    options: ['Move toward the upper bout or the hole, a little at a time', 'Turn the guitar channel up until it sounds full', 'Add a second mic aimed straight into the sound hole to fill it out'],
    correct: 'Move toward the upper bout or the hole, a little at a time',
    explain: 'A view mostly of the strings and neck lacks the body. Include more of the top, then judge in the mix.',
    why: {
      'Turn the guitar channel up until it sounds full': 'Louder is not fuller: the balance comes from where the mic is.',
      'Add a second mic aimed straight into the sound hole to fill it out': 'Fix the one mic first; a second brings its own combining problems.',
    },
  },
  {
    id: 'ag.sym.noise',
    observation: 'Too much pick, nail or fret noise',
    firstChecks: 'Is the capsule too close to the picking hand or the neck? Change angle and distance; confirm the player intends those sounds.',
    options: ['Change angle and distance; ask whether those sounds are wanted', 'Cut the highs on the channel until the noise is gone', 'Ask the player to play with their fingertips instead'],
    correct: 'Change angle and distance; ask whether those sounds are wanted',
    explain: 'A capsule close to the hands magnifies them. Move it — and check whether the player wants some of that attack.',
    why: {
      'Cut the highs on the channel until the noise is gone': 'EQ dulls the whole guitar. Move the mic first.',
      'Ask the player to play with their fingertips instead': 'The playing is the player’s. Change the mic, not the technique.',
    },
  },
  {
    id: 'ag.sym.hollow',
    observation: 'A stereo pair or two mics turn hollow in mono',
    firstChecks: 'Are the two mics hearing different arrival paths? Solo each, sum in mono, then move or rebalance.',
    options: ['Solo each, sum in mono, then move or rebalance a mic', 'Flip a polarity switch and leave it there', 'Pan both mics hard apart so they do not mix'],
    correct: 'Solo each, sum in mono, then move or rebalance a mic',
    explain: 'The comb comes from the timing between the mics. Changing a position fixes the cause; a switch is a test, not a cure.',
    why: {
      'Flip a polarity switch and leave it there': 'Polarity moves the notches; it does not remove the delay. Check by ear.',
      'Pan both mics hard apart so they do not mix': 'They still mix in mono and in the room. Fix the timing.',
    },
  },
  {
    id: 'ag.sym.fb',
    observation: 'Live feedback',
    firstChecks: 'Is the mic too far away, or aimed toward a wedge or the PA? Lower the level, revise the geometry, or blend in the pickup.',
    options: ['Lower the level, then revise the geometry or lean on the pickup', 'Boost the channel, then cut the ringing pitch hard with EQ', 'Move the mic farther away so the guitar is cleaner'],
    correct: 'Lower the level, then revise the geometry or lean on the pickup',
    explain: 'Bring the level down first. Then bring a directional mic closer, aim its rejection at the wedge, close unused mics — or carry more of the guitar on its pickup.',
    why: {
      'Boost the channel, then cut the ringing pitch hard with EQ': 'More gain is the wrong way. Lower it, then fix the geometry.',
      'Move the mic farther away so the guitar is cleaner': 'Farther away, the guitar is weaker against the stage: feedback comes sooner.',
    },
  },
  {
    id: 'ag.sym.clip',
    observation: 'The mic clip is marking the finish or touches the player',
    firstChecks: 'Stop; remove it with the player and use a compatible mount or a stand.',
    options: ['Stop, remove it with the player, and change the mount', 'Pad it with some tape and carry on to the end of the song', 'Tighten it further so that it stops moving'],
    correct: 'Stop, remove it with the player, and change the mount',
    explain: 'A clip must suit the body’s depth and finish, with the owner’s agreement. If it marks or rattles, stop and use a compatible mount or a stand.',
    why: {
      'Pad it with some tape and carry on to the end of the song': 'Tape on a finish can damage it too. Stop and change the mount.',
      'Tighten it further so that it stops moving': 'Over-tightening is how finishes get marked. Remove it.',
    },
  },
];

/** The one-mic setup (L23-L27), with the power and gain rules. */
const orderTasks: OrderTask[] = [
  {
    id: 'ag.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic acoustic guitar setup in the order you would do them.',
    steps: [
      { text: 'Ask the player: the material, picking or strumming, singing, movement, the sound wanted', early: 'Start with the player and the guitar.' },
      { text: 'Choose a mic whose pattern and power suit, and a secure stand or an approved clip', early: 'Choose the mic once you know the material and the room.' },
      { text: 'Have the player stop; place it near the 12th fret; check the arm, hand and sight line', early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is placed and connected — with the outputs muted first.' },
      { text: 'Set input gain on the loudest passage, with headroom; check soft notes', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare toward the hole, toward the bridge, farther back — one change at a time', early: 'Compare only once the level is set safely — and at matched levels, so louder does not win.' },
      { text: 'Secure the stand and cable; recheck as the player sits, stands and sings', early: 'Secure it last, then watch the whole performance again.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it for the loudest passage with headroom, and check the softest notes sit above the noise.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'This input gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point for this kind of mic, from the right point', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, mount and cable stay clear of the arm, the hands and the player’s view', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on acoustic guitar', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const LOUD_REASON: SetupReason = { id: 'r.loud', label: 'It will give the loudest guitar of any position', role: 'wrong', feedback: 'Loudness is not a passing reason — level comes from gain — and the loudest spot is often the boomiest.' };

/** The final task (L72): several setups pass; the reasons are graded. */
const setupTasks: SetupTask[] = [
  {
    id: 'ag.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A singer-guitarist on a small, fairly loud stage. A floor wedge sits in front of them. One channel for the guitar; phantom power is available.',
    setups: [
      { id: 'a', label: 'Small condenser, cardioid, 15–30 cm out from the 12th fret, its rear toward the wedge', ok: true, power: 'phantom', feedback: 'A recommended starting point, clear of the hands, its rejection turned toward the wedge.' },
      { id: 'b', label: 'Clip-on mini on a clip made for this guitar, between the neck joint and the hole', ok: true, power: 'phantom', feedback: 'A recommended starting point that keeps its distance as the player moves — with the owner’s OK.' },
      { id: 'c', label: 'Instrument dynamic, cardioid, near the 12th fret at the close end of the band', ok: true, power: 'none', feedback: 'A robust close option at a recommended starting point; watch the proximity bass.' },
      { id: 'd', label: 'Small condenser 3 cm from the sound hole, for the most level', ok: false, power: 'phantom', feedback: 'Right at the hole it booms, and it sits in the strumming hand’s path. Start near the 12th fret.' },
      { id: 'e', label: 'Small condenser 1 m back, to hear the whole guitar', ok: false, power: 'phantom', feedback: 'On a loud stage, that far back hears the wedge and the band as much as the guitar — feedback comes early.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.null', label: 'Aiming its rejection toward the wedge helps against feedback', role: 'optional', feedback: 'A fair live reason — though no position alone prevents feedback.' }, BRAND_REASON, LOUD_REASON],
    explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named point, clearance from the player, and power that matches the mic.',
  },
  {
    id: 'ag.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A quiet studio, a soft fingerstyle piece on a nylon-string guitar. The only spare input has NO phantom power.',
    setups: [
      { id: 'a', label: 'Instrument dynamic, 15–30 cm out from the 12th fret (here, the neck joint)', ok: true, power: 'none', feedback: 'A recommended starting point; a dynamic needs no phantom. Check that the soft notes sit above the noise.' },
      { id: 'b', label: 'Instrument dynamic, 15–30 cm out from the sound hole, listening for boom', ok: true, power: 'none', feedback: 'A recommended starting point; it needs no phantom. Compare it with the 12th fret.' },
      { id: 'c', label: 'Small condenser, cardioid, near the 12th fret', ok: false, power: 'phantom', feedback: 'A fair position — but this input has no phantom power, and a condenser needs it.' },
      { id: 'd', label: 'Clip-on mini between the neck joint and the hole', ok: false, power: 'phantom', feedback: 'A miniature condenser needs phantom power, which this input does not have.' },
      { id: 'e', label: 'Instrument dynamic 2 cm over the strings at the 12th fret, for detail', ok: false, power: 'none', feedback: 'That is in the fretting hand’s path, and it magnifies finger noise. Start out in front.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.noise', label: 'I will check that the softest notes sit clear of the room and preamp noise', role: 'optional', feedback: 'A fair reason for a quiet nylon piece.' }, BRAND_REASON, { id: 'r.bright', label: 'A bright spot near the bridge will make it sound like a steel-string', role: 'wrong', feedback: 'Choosing a bright position just to imitate steel strings works against this guitar. Balance it as it is.' }],
    explain: 'Two positions pass. What passes is the reasoning: a sensible starting point, clear of the player’s hands, powered by what this input can supply.',
  },
];

/** One ungraded prediction before each rack activity (try before tell). */
const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what moves most of the air when a guitar string is plucked?', options: ['The string itself', 'The top, driven by the bridge', 'The headstock and tuners'], after: 'Now STEP through the pluck (or PLAY ONCE) and watch what each event drives.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you slide the mic from near the 12th fret toward the sound hole. What changes?', options: ['More string detail', 'More body and low end', 'It depends on this guitar'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will this supercardioid reject the floor wedge best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

/* THE QUICK CHECK (LESSON_JOURNEY §2.5): two items per foundation page;
 * q.6 (hearing) is critical. It opens the activities; it credits nothing. */
const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'On a steel-string dreadnought, where does the neck meet the body?',
    options: ['At the 14th fret — the 12th is out on the neck', 'At the 12th fret, the same as a classical guitar', 'At the sound hole, where the fingerboard ends'],
    correct: 'At the 14th fret — the 12th is out on the neck',
    explain: 'These steel-string bodies join at the 14th fret; a classical body joins at the 12th. So “the 12th fret” and “the neck joint” are different places on a dreadnought.',
    why: {
      'At the 12th fret, the same as a classical guitar': 'That is the classical body. This steel-string dreadnought joins at the 14th.',
      'At the sound hole, where the fingerboard ends': 'The fingerboard runs on over the body toward the hole; the neck itself joins at the 14th fret.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What does the bridge do?',
    options: ['Passes the strings’ pull to the top, which it drives', 'Holds the strings at the headstock end for tuning', 'Covers the sound hole to protect it from the pick'],
    correct: 'Passes the strings’ pull to the top, which it drives',
    explain: 'The strings cross the saddle on the bridge; as they swing, the bridge rocks and drives the thin top.',
    why: {
      'Holds the strings at the headstock end for tuning': 'That is the nut and the tuners, at the other end.',
      'Covers the sound hole to protect it from the pick': 'That is roughly the pickguard’s job, beside the hole.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'A string plucked exactly at its middle drives which of its shapes?',
    options: ['Only the odd ones — the even ones are still there', 'All of its shapes, each one just as hard', 'Only the even ones — the odd ones are still there'],
    correct: 'Only the odd ones — the even ones are still there',
    explain: 'A pluck drives a shape only as much as the string moves at the pick; every even shape has a still point at the middle.',
    why: {
      'All of its shapes, each one just as hard': 'The pick touches one spot; a shape still there is not driven.',
      'Only the even ones — the odd ones are still there': 'The reverse: the even ones are still at the middle.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Why is a mic right at the sound hole often boomy?',
    options: ['The air in the body breathes there — a lot of low end', 'The strings are thickest and loudest over the hole', 'The hole is where the top moves least of all'],
    correct: 'The air in the body breathes there — a lot of low end',
    explain: 'The body’s air moves in and out through the hole; close to it, a mic — especially a directional one, with its proximity effect — hears a pile-up of low end.',
    why: {
      'The strings are thickest and loudest over the hole': 'The strings are the same all along. The hole is where the body’s air moves.',
      'The hole is where the top moves least of all': 'The hole is an opening, not the top. The air through it is the point.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What must a stand mic stay out of, round a seated guitarist?',
    options: ['The strumming arm, the fretting hand and their view of the neck', 'The front of the guitar, so the audience can see it clearly at all times', 'The space behind the chair, where all the cables run'],
    correct: 'The strumming arm, the fretting hand and their view of the neck',
    explain: 'The arm sweeps over the body, the hand travels the neck, and the player watches it. The space in front of the guitar is usually where a mic comes in.',
    why: {
      'The front of the guitar, so the audience can see it clearly at all times': 'In front is usually where the mic goes. The player’s space is what to keep clear.',
      'The space behind the chair, where all the cables run': 'Cables need a route, but the moving space is the player’s arm, hand and view.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your guitar mic is rated to a very high maximum SPL. What does that tell you about a long, loud soundcheck?',
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe for a while, as long as the stage stays below the mic’s rating', 'It is safe as long as the mic is nearer the guitar than you'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe for a while, as long as the stage stays below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is nearer the guitar than you': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  },
];

export const C01_LESSON: Lesson = {
  id: 'C01',
  labId: 'strings',
  title: 'Acoustic Guitar',
  subtitle: 'Steel-string, twelve-string and nylon — near the 12th fret, then move',
  noun: { one: 'guitar', many: 'guitars' },
  model: C01_MODEL,
  micTypeIds: ['sdcCard', 'instDynCard', 'clipCond'],
  zones: C01_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A wooden box with a thin top, strung with six strings (twelve, in six pairs, on a twelve-string). The strings cross a bridge glued to the top; plucked or strummed, they drive the top, and the top and the air in the body make the sound. Steel strings ring brighter and harder; nylon strings, on a lighter classical body, rounder and softer.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Almost everywhere — solo, with a singer, in folk, country, pop and classical music, on stage and in the studio. Often the player sings too, right above it. This lesson covers studio recording and live sound.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Chords strummed as the rhythm, picked patterns, single-note melody, even taps on the body. Ask what the player will actually play — gentle fingerstyle and hard strumming want different things from a mic.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'This lab draws a steel-string dreadnought about 51 cm (20 in) long and 41 cm (16 in) wide, about 12 cm (4.6 in) deep, with a 65 cm (25.5 in) string length; and a classical guitar about 49 × 37 cm (19.25 × 14.6 in), 10 cm (4 in) deep, with a 65 cm string length.', src: 'TAY-DN' },
  ],
  sound: {
    stages: [
      { title: 'The pick pulls a string', text: 'A pick, a finger or a nail pulls one string aside and lets it go. That brief release is where the ATTACK — the sharp start of the note — begins.', byVariant: { twelve: 'A pick or a finger pulls a PAIR of strings aside and lets them go — on the lower pairs, one string an octave above the other. That brief release is where the ATTACK begins.', nylon: 'A finger, a thumb or a nail pulls one string aside and lets it go — softer and rounder than a steel string. That brief release is where the ATTACK begins.' } },
      { title: 'The string swings', text: 'Released, the string swings between its two still ends — the saddle on the bridge and the nut (or the fret the finger presses). Its lowest shape is drawn here many times larger than it really moves. On its own, a thin string moves very little air.' },
      { title: 'The bridge drives the top', text: 'Each swing tugs at the saddle, so the bridge rocks and drives the thin top. The top is what really moves the air — and it moves the air inside the body, too.' },
      { title: 'Sound leaves', text: 'Sound leaves from the top, most strongly round the bridge, and through the sound hole, where the air in the body breathes in and out — a big part of the low end. The strings and the body ringing together are the BODY of the sound.' },
    ],
    attack: 'The start of the note: the pick, finger or nail releasing the string, with its click and scrape. It is heard most directly near the strings and the hands — so a mic near the bridge or the neck tends to hear more of it.',
    body: 'The ring: the strings, the top and the air in the body sounding together after the attack. Much of it leaves from the top round the bridge and through the sound hole — a mic toward the hole tends to hear more body and low end. Both are tendencies, and guitars vary.',
    head: { diameterMm: 100, rods: 0, label: 'the sound hole', strikeSrc: 'LESSON' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the player and the guitar', short: 'PLAYER', note: 'Seated, the guitar on the thigh, the neck pointing to the player’s left. Their strumming arm sweeps over the body, the fretting hand travels the neck, and they look at the neck as they play — all of it is theirs.', prov: { kind: 'illustrative', reason: 'a typical seated posture' }, tag: 'KEEP CLEAR', scene: 'all', planIds: ['player'] },
      { id: 'chair', label: 'the chair', short: 'CHAIR', note: 'Behind the player. A stand’s legs share the floor with the chair’s and the player’s feet: keep them out of the way.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'FLOOR SPACE', scene: 'kit' },
      { id: 'vocal', label: 'the vocal mic (a singer-guitarist)', short: 'VOCAL MIC', note: 'In front of the mouth, a short way above the guitar. The voice reaches the guitar mic and the guitar reaches the vocal mic — plan the balance of the two, and keep the booms apart.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SPILL', scene: 'kit' },
      { id: 'di', label: 'DI box and pickup cable', short: 'DI', note: 'Many acoustic guitars carry a pickup: a separate electrical path, not a microphone. Its cable runs from the tail of the guitar to a DI box on the floor — route it clear of the feet and the strap.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGNAL PATH', scene: 'kit' },
      { id: 'wedge', label: 'the player’s floor wedge (monitor)', short: 'WEDGE', note: 'In front of the player, facing back at them so they hear themselves. Behind and below a guitar mic aimed at the guitar — the source a pattern’s rejection is aimed at.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the band: bass amp and drums', short: 'BAND', note: 'Upstage, behind the player. Loud sources that every open mic hears — a close directional mic hears relatively less of them.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage', planIds: ['bassAmp', 'kit'] },
      { id: 'pa', label: 'the PA', short: 'PA', note: 'At the front corners, facing the audience. What the PA plays can reach the stage and the guitar — and the guitar’s top can reflect it into the mic.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FEEDBACK', scene: 'stage', planIds: ['paL', 'paR'] },
      { id: 'audience', label: 'the audience', short: 'AUDIENCE', note: 'Beyond the stage edge. Live, the PA carries the guitar to them; the stage level decides how close a mic must be.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet studio there are no wedges on the floor; the room itself becomes part of the sound, and a farther mic hears more of it.', prov: { kind: 'illustrative', reason: 'a generic room; no source gives its size' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a wedge in front of the player, the band behind, the PA facing the audience. Stage spill, the voice above the guitar and the gain available before feedback push toward close, aimed pickup — or the guitar’s pickup.',
    studio: 'STUDIO: no wedges on the floor, repeated trials are practical when the player stops, and a good room can be part of the sound — a farther or omni mic becomes an option.',
  },
  diagnostic,
  practice: {
    task: 'Choose a one-mic setup for a given guitar, player and room, describe an alternative position, and explain what would justify a second mic. With a real guitar and the player’s agreement, you can record what you tried below.',
    fields: [
      { id: 'guitar', label: 'Guitar (body, strings, pickup)', kind: 'text' },
      { id: 'body', label: 'Strings', kind: 'choice', choices: ['steel six', 'twelve-string', 'nylon'] },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'dynamic', 'clip-on mini', 'other'] },
      { id: 'pattern', label: 'Pattern', kind: 'text' },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, and from which point', kind: 'text' },
      { id: 'aim', label: 'Aim, and where the wedge or voice sits off it', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  // INTERNAL record (never shown): the unknowns in words; `dims` ties each to
  // the placeholders it covers (validateLesson checks every one is listed).
  unknowns: [
    { text: 'The player’s posture and reach — the strumming hand and arm, the fretting hand, the torso, head, legs and feet — and the seated height (the strings 65 cm above the floor): all drawing defaults (proposal §5). No HEIGHT readout is shown.', dims: ['yFloor'] },
    { text: 'The top’s, the strings’ and the bridge’s keep-off margins (8 mm, 10 mm, 6 mm): illustrative values for the owner to approve.', dims: ['steel', 'twelve', 'nylon'] },
    { text: 'Bout stations, the upper-bout width, the soundhole size and position, the bridge plate, the nut and fingerboard widths, the headstock and the string heights — drawing defaults (proposal §2, §8). The fingerboard is drawn ending at the soundhole’s edge.', dims: [] },
    { text: 'The twelve-string body (the dreadnought’s sizes) and its octave-pair order (octaves on the lower four pairs).', dims: [] },
    { text: 'The “near” tolerance (8 cm), the aim tolerance (11 cm), the clip’s capsule height (3–9 cm) and reach (20 cm), and the upper-bout band (25–36 cm for “approximately 12 in”).', dims: [] },
    { text: 'The small condenser’s diameter and the clip mini’s capsule size — drawing defaults.', dims: [] },
    { text: 'The wedge, the vocal mic, the DI box, the band and the PA positions — a typical layout.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges: C01_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every guitar, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: three typical bodies, a seated player whose reach is drawn roughly, mic patterns and the two-mic comb as textbook shapes, and string and top motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped.',
  copy: C01_COPY,
};
