/**
 * C10 HARP (concert pedal harp, lever harp) — the lesson's pages as DATA.
 * Words from the owner's lesson (docs/labs/miking/source_text/Harp-Miking-
 * Technique.txt, "L<n>" in COMMENTS only) with the fixes logged in
 * docs/labs/miking/CORRECTIONS_LOG.md (C10-01 … C10-06) applied.
 *
 * OWNER RULING 2026-10-04: starting points, never dogma; no source, brand or
 * model in learner text; no badges. Research in docs/labs/miking/harp/.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupReason, SetupTask, Symptom, Wedge } from '../../engine/model/types.ts';
import { HARP_MODEL } from './geometry.ts';
import { HARP_ZONES } from './model.ts';
import { HARP_COPY } from './copy.ts';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the harp',
    goal: 'Get to know the harp — the concert pedal harp and the smaller lever harp: what it is, where you meet it, what it does in the music, and its parts, from the soundboard to the pillar — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The strings stand between the soundboard and the neck; the soundbox leans back onto the harpist’s shoulder, with sound holes in its back; the pillar carries the pull. The harpist’s hands, feet and view take the space round it.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a pluck becomes sound — the string, the soundboard, the air inside the box — and where the sound leaves the harp. Shown, never played.',
    credit: { scenarios: ['hp.snd.1', 'hp.snd.2', 'hp.snd.3'], interactive: 'soundPath', note: 'Step the pluck through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A plucked string pulls on the soundboard where it is anchored, and the board moves the air; air also leaves through the holes in the box’s back. A close mic hears one part of a large source; distance blends the whole.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the harp’s surroundings — the harpist’s hands, feet, view and head, the pedals or levers, what a stage and a studio add — and what to do before any mic.',
    credit: { scenarios: ['hp.set.1', 'hp.set.2', 'hp.set.3'], note: 'Answer the three checks.' },
    takeaway: 'The harpist’s hands work both sides of the strings and their feet the pedals: no stand, mic or cable goes there, and nothing over the harp or their head. Ask before anything touches the harp. Protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for the harp by its properties — pattern, power, size and mount — not by its brand.',
    credit: { scenarios: ['hp.mic.1', 'hp.mic.2', 'hp.mic.3', 'hp.mic.4', 'hp.rec.1'], note: 'Answer the five checks (one reaches back to how the harp sounds).' },
    takeaway: 'An omni takes in the whole harp and the room; a cardioid separates it from its neighbours but can exaggerate the lows up close. A miniature can hide at a sound hole, with the owner’s agreement. Pattern alone does not set the tone.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — about 60 cm in front, near the top of the pillar, behind on the harpist’s right, 30 cm from the board, or at a sound hole — measured from the surface each names, clear of the harpist, then move the mic and see what changes.',
    credit: { scenarios: ['hp.place.1', 'hp.place.2', 'hp.place.3', 'hp.rec.2'], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named surface — not a rule. Distance from the board, height and angle are separate things to try, and the harpist’s space comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim the mic so its pattern’s rejection faces the harpist’s wedge — and know what a pattern can and cannot do on a stage.',
    credit: { scenarios: ['hp.ctx.1', 'hp.ctx.2', 'hp.ctx.studio', 'hp.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Close placement and an aimed rejection help a quiet harp through a stage; a distant pair suits a good room. Real nulls are shallower than the picture, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two spots',
    goal: 'See why two spots on the soundboard can comb in mono, how the arrival-time difference places the notches, and what the polarity switch does and does not change.',
    credit: { scenarios: ['hp.two.1', 'hp.two.2', 'hp.two.3', 'hp.two.4'], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
    takeaway: 'Two spots hear the board at different times: in mono that can comb. Moving a mic changes the delay; the polarity switch does not. They need not be panned apart. Judge them in mono, at matched levels.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — distance from the board, the pattern, the pair’s geometry, the monitors, the mount — and talk to the harpist before calling a resonance a fault.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up one harp mic in the right order, choose and justify a setup for two different briefs, and say what would justify a second mic.',
    credit: { scenarios: ['hp.prac.order', 'hp.prac.gain', 'hp.prac.setup1', 'hp.prac.setup2', 'hp.prac.3', 'hp.mix.1', 'hp.mix.2', 'hp.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real harp.' },
    takeaway: 'Clearance from the harpist, an approved mount, correct power and level checks, pattern reasoning and an accurate account of polarity versus delay pass. A brand or the “closest” position do not — and more than one setup can pass.',
  },
};

/* THE CHECKS (lesson lines in comments only: hp.snd.* L6 · hp.set.* L7, L65 ·
 * hp.mic.* L29, L37 · hp.place.* L9-L27 · hp.ctx.* L34-L38 · hp.two.* L35 ·
 * hp.prac.* L67-L71). */
const scenarios: MikingScenario[] = [
  {
    id: 'hp.snd.1',
    page: 'sound',
    prompt: 'A harp string is plucked. What moves most of the air?',
    options: ['The soundboard, pulled by the string where it is anchored', 'The string itself, since it is the part the finger plucks and lets go', 'The pillar, which rings when the strings pull on it'],
    correct: 'The soundboard, pulled by the string where it is anchored',
    explain: 'A string is too thin to move much air. Anchored in the soundboard, it pulls on it as it swings, and the board — light and large — moves the air.',
    why: {
      'The string itself, since it is the part the finger plucks and lets go': 'It vibrates, but it moves very little air on its own. The soundboard does that.',
      'The pillar, which rings when the strings pull on it': 'The pillar carries the strings’ pull; the soundboard is what radiates.',
    },
  },
  {
    id: 'hp.snd.2',
    page: 'sound',
    prompt: 'Where else does sound leave the harp, besides the soundboard’s face?',
    options: ['Through the sound holes in the back of the soundbox', 'Out of the top of the pillar, above the neck', 'Through the pedals, down into the floor'],
    correct: 'Through the sound holes in the back of the soundbox',
    explain: 'The air inside the soundbox is pushed and pulled too; it leaves through the holes in the box’s back — toward the harpist.',
    why: {
      'Out of the top of the pillar, above the neck': 'The pillar is a solid column. The air inside the soundbox leaves through the holes in its back.',
      'Through the pedals, down into the floor': 'Pedals change the strings’ pitches. Air leaves through the sound holes.',
    },
  },
  {
    id: 'hp.snd.3',
    page: 'sound',
    prompt: 'A mic is pointed straight at the middle of the soundboard from close by. What is a common result?',
    options: ['One region and the board’s low resonance stand out', 'The whole harp, evenly, from the bass to the treble', 'Mostly the room, since the board reflects the sound'],
    correct: 'One region and the board’s low resonance stand out',
    explain: 'Close in, a mic hears only part of a large source — and a directional mic pointed straight at the board can boom. Distance, height or a spot higher up give more of the whole.',
    why: {
      'The whole harp, evenly, from the bass to the treble': 'Close in, the mic hears the part of the board it faces. The whole harp blends farther away.',
      'Mostly the room, since the board reflects the sound': 'Close to the board the harp dominates; the room comes in with distance.',
    },
  },
  {
    id: 'hp.set.1',
    page: 'setting',
    prompt: 'A spot mic near the top of the pillar would be easiest from a boom over the harpist’s head. What do you do?',
    options: ['Use a secure stand from the side, never over the harpist', 'Swing the boom over quickly while the harpist is not playing', 'Hold the mic there by hand during the performance'],
    correct: 'Use a secure stand from the side, never over the harpist',
    explain: 'Nothing moves over the harp or the harpist’s head without a secure stand and a controlled path. Bring the boom in from the side, clear of their reach and view.',
    why: {
      'Swing the boom over quickly while the harpist is not playing': 'Speed is not safety. Nothing goes over the harpist’s head without a secure stand.',
      'Hold the mic there by hand during the performance': 'A hand-held mic moves and can strike the harp. Use a secure stand.',
    },
  },
  {
    id: 'hp.set.2',
    page: 'setting',
    prompt: 'Your harp mic is rated to a very high maximum SPL. What does that tell you about a long, loud rehearsal next to the orchestra?',
    options: ['Nothing — a mic’s max SPL is a distortion limit, not a hearing limit', 'Everyone is safe while the music stays below the mic’s rated level', 'You are safe as long as the mic is nearer the harp than you'],
    correct: 'Nothing — a mic’s max SPL is a distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, and every 3 dBA more halves the time — and an orchestra or band around the harp is loud.',
    why: {
      'Everyone is safe while the music stays below the mic’s rated level': 'Max SPL tells you when the mic distorts, not what your ears can take. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'You are safe as long as the mic is nearer the harp than you': 'A mic is not a hearing meter. Measure where the person listens, and keep levels and time down.',
    },
  },
  {
    id: 'hp.set.3',
    page: 'setting',
    prompt: 'The harp sounds boomy and you want to put some foam in a sound hole. What comes first?',
    options: ['Ask the owner; only with their agreement, and nothing forced in', 'Push a little foam in yourself: it comes out again after the concert', 'Tape over the hole instead, which is gentler than foam'],
    correct: 'Ask the owner; only with their agreement, and nothing forced in',
    explain: 'Partly filling a hole is a technique some use — but only when the owner asks for it. First try moving the mic: up, out, or away from the middle of the board.',
    why: {
      'Push a little foam in yourself: it comes out again after the concert': 'Nothing goes into the harp without the owner’s agreement. Move the mic first.',
      'Tape over the hole instead, which is gentler than foam': 'Tape on the finish can damage it. Ask the owner, and move the mic first.',
    },
  },
  {
    id: 'hp.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic close to the soundboard hears what, compared with one 2 m away?',
    options: ['Part of the harp, with more low resonance', 'The whole harp, with the room blended in', 'Mostly the strings, with no board at all'],
    correct: 'Part of the harp, with more low resonance',
    explain: 'The harp is a large source: close in, a mic hears the region it faces, often with its low resonance; around 2–3 m the whole instrument and the room blend.',
    why: {
      'The whole harp, with the room blended in': 'That is the distant view, around 2–3 m in a good room.',
      'Mostly the strings, with no board at all': 'Close to the board, the board is what it hears most.',
    },
  },
  {
    id: 'hp.mic.1',
    page: 'microphone',
    prompt: 'A solo harp in a good room. Why might a spaced pair of omnis suit it?',
    options: ['They take in the whole harp and the room together', 'They reject the room, so the harp sounds much closer', 'They need no stands, so nothing is near the harp'],
    correct: 'They take in the whole harp and the room together',
    explain: 'Omnis do not reject by direction: about 2 m or more from a full-size harp they blend the whole instrument with the room — and check the pair in mono.',
    why: {
      'They reject the room, so the harp sounds much closer': 'Omnis take in the room; that is why they suit a good one.',
      'They need no stands, so nothing is near the harp': 'They stand on stands. The reason is the blend, not the mount.',
    },
  },
  {
    id: 'hp.mic.2',
    page: 'microphone',
    prompt: 'A cardioid close to the soundboard sounds bass-heavy. Which property is a likely part of it?',
    options: ['Proximity effect: a directional mic up close lifts the lows', 'A cardioid hears less bass than an omni, whatever its distance', 'The cardioid is rejecting the high strings on purpose'],
    correct: 'Proximity effect: a directional mic up close lifts the lows',
    explain: 'Directional mics gain low end close to a source; pointed at the board’s middle, that adds to its own resonance. Move out or up, or try an omni.',
    why: {
      'A cardioid hears less bass than an omni, whatever its distance': 'Close in, a cardioid often hears MORE low end than an omni: proximity effect.',
      'The cardioid is rejecting the high strings on purpose': 'It rejects by direction, not by pitch. The low lift comes from being close.',
    },
  },
  {
    id: 'hp.mic.3',
    page: 'microphone',
    prompt: 'Where does a supercardioid reject the most?',
    options: ['Off to each side of the rear, near 125°', 'Straight behind it, right on its rear axis', 'At its sides, square to its front'],
    correct: 'Off to each side of the rear, near 125°',
    explain: 'A supercardioid has a small rear lobe; its deepest rejection is toward the rear but off the axis.',
    why: {
      'Straight behind it, right on its rear axis': 'That is a cardioid. A supercardioid picks up a little straight behind.',
      'At its sides, square to its front': 'At 90° a supercardioid still picks up a fair amount; its deepest rejection is near 125°.',
    },
  },
  {
    id: 'hp.mic.4',
    page: 'microphone',
    prompt: 'You plan a miniature at a sound hole for a concert. What does it need?',
    options: ['Phantom power, an approved holder and the owner’s agreement', 'Nothing: miniatures are dynamic mics, so they need no power at all', 'Tape, so that it stays firmly on the soundboard'],
    correct: 'Phantom power, an approved holder and the owner’s agreement',
    explain: 'A miniature is a condenser: it needs phantom power, often through its own adapter. It goes on a holder the owner approves — never forced in, never taped to the finish.',
    why: {
      'Nothing: miniatures are dynamic mics, so they need no power at all': 'Miniatures like this are condensers: they need phantom power.',
      'Tape, so that it stays firmly on the soundboard': 'Tape can damage the finish. Use an approved holder.',
    },
  },
  {
    id: 'hp.place.1',
    page: 'placement',
    prompt: 'A starting point says “about 60 cm from the soundboard”. Your readout says 60 cm from the PILLAR. Are you in it?',
    options: ['Not necessarily: measure from the soundboard it names', 'Yes: 60 cm is 60 cm, whichever part you start from', 'Yes, as long as the mic is at the harpist’s head height'],
    correct: 'Not necessarily: measure from the soundboard it names',
    explain: 'A distance means something only with its surface. The soundboard leans back, far from the pillar — which is why every readout names what it measures from.',
    why: {
      'Yes: 60 cm is 60 cm, whichever part you start from': 'Same number, different surface. The band is measured from the soundboard.',
      'Yes, as long as the mic is at the harpist’s head height': 'Height is a separate check. The distance is read from the soundboard.',
    },
  },
  {
    id: 'hp.place.2',
    page: 'placement',
    prompt: 'The harp is too forward and bright from a spot near the top of the pillar. What is one alternative to try?',
    options: ['Slightly behind, on the side away from the harpist’s head', 'Closer to the pillar, so the harp sounds more natural and less bright', 'Straight at the middle of the board, very close'],
    correct: 'Slightly behind, on the side away from the harpist’s head',
    explain: 'A spot slightly behind and above, on the side away from the harpist’s head, looking down at the board, is a gentler alternative — or bring the pillar spot down in the blend.',
    why: {
      'Closer to the pillar, so the harp sounds more natural and less bright': 'Closer tends to make it MORE forward. Try another perspective or less level.',
      'Straight at the middle of the board, very close': 'That tends to boom and favour one region.',
    },
  },
  {
    id: 'hp.place.3',
    page: 'placement',
    prompt: 'Why keep a front mic a little to one side of the strings rather than right in their plane?',
    options: ['The harpist’s hands work both sides of the strings there', 'The strings are loudest exactly in their own plane', 'The starting points are all measured from the string plane itself'],
    correct: 'The harpist’s hands work both sides of the strings there',
    explain: 'The hands reach round both sides of the strings: a mic in their plane is in the way. A little to one side, it still looks back at the board.',
    why: {
      'The strings are loudest exactly in their own plane': 'The reason is the hands’ space, not loudness.',
      'The starting points are all measured from the string plane itself': 'Most are measured from the soundboard; the side offset is about clearance.',
    },
  },
  {
    id: 'hp.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What must a harp mic, its stand and its cable stay out of?',
    options: ['The harpist’s hands and view, the pedals, and the space over their head', 'The front of the harp, so that the audience can see the strings and the hands', 'The soundbox’s back, which must not be looked at by a mic'],
    correct: 'The harpist’s hands and view, the pedals, and the space over their head',
    explain: 'Clearance comes first: the hands round the strings, the feet on the pedals, the view to the music, and nothing swinging over the harp or the harpist.',
    why: {
      'The front of the harp, so that the audience can see the strings and the hands': 'The front is often where a mic starts. The space to protect is the harpist’s.',
      'The soundbox’s back, which must not be looked at by a mic': 'A mic may look at the back (the sound holes) — clear of the harpist.',
    },
  },
  {
    id: 'hp.ctx.1',
    page: 'context',
    prompt: 'The harpist’s wedge is loud in the harp mic. What is a good first move to try?',
    options: ['Turn the mic so the wedge falls in its rejection', 'Turn the harp channel up so the harp covers the wedge', 'Move the mic right up against the strings'],
    correct: 'Turn the mic so the wedge falls in its rejection',
    explain: 'Aim the pattern’s rejection at the wedge, by its actual pattern, while the mic still faces the board — then lower the wedge or move it if needed, with the level down first.',
    why: {
      'Turn the harp channel up so the harp covers the wedge': 'More gain raises the wedge in that channel too, and the feedback risk.',
      'Move the mic right up against the strings': 'That puts it in the harpist’s hands. Aim from a safe position.',
    },
  },
  {
    id: 'hp.ctx.2',
    page: 'context',
    prompt: 'With a cardioid facing the harp, where should a wedge sit for the most rejection?',
    options: ['Straight behind the mic, on its rear axis', 'Off to one side of the rear, near 125°', 'Beside the mic, square to its front'],
    correct: 'Straight behind the mic, on its rear axis',
    explain: 'A cardioid rejects most directly behind (180°). A supercardioid’s deepest rejection is off the rear axis, near 125°. Aim by the actual pattern.',
    why: {
      'Off to one side of the rear, near 125°': 'That is a supercardioid. A cardioid rejects most straight behind.',
      'Beside the mic, square to its front': 'At 90° a cardioid still picks up half as much as on axis.',
    },
  },
  {
    id: 'hp.ctx.studio',
    page: 'context',
    prompt: 'A solo harp in a beautiful room. What could justify a pair about 2 m away instead of close spots?',
    options: ['The room is worth hearing, and the whole harp blends at that distance', 'Distant mics pick up far less of the harpist’s fingers than close ones do', 'Close spots belong on a stage, not in a studio, by convention'],
    correct: 'The room is worth hearing, and the whole harp blends at that distance',
    explain: 'Around 2–3 m from a full-size harp the instrument and the room integrate — a natural solo perspective. Close spots bring definition; the choice is what the music needs.',
    why: {
      'Distant mics pick up far less of the harpist’s fingers than close ones do': 'Distance does soften finger noise, but the reason is the blend and the room.',
      'Close spots belong on a stage, not in a studio, by convention': 'Close spots are used in studios too. The decision is the perspective.',
    },
  },
  {
    id: 'hp.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Air from inside the soundbox leaves the harp where?',
    options: ['Through the sound holes in its back, toward the harpist', 'Through the top of the neck, above the strings and the tuning pins', 'Through the base, down into the floor'],
    correct: 'Through the sound holes in its back, toward the harpist',
    explain: 'The holes are in the soundbox’s back, facing the harpist — a mic behind the harp, or a miniature at a hole, hears that air.',
    why: {
      'Through the top of the neck, above the strings and the tuning pins': 'The neck holds the tuning pins; the air leaves through the holes in the box’s back.',
      'Through the base, down into the floor': 'The base is closed; the holes are in the box’s back.',
    },
  },
  {
    id: 'hp.two.1',
    page: 'twoMic',
    prompt: 'Two spots on the soundboard, an upper and a lower. Why can the pair sound hollow in mono?',
    options: ['The board reaches the two mics at different times', 'The lower mic hears the board in reverse polarity', 'Two mics on one harp cancel each other completely in mono'],
    correct: 'The board reaches the two mics at different times',
    explain: 'Sound from a point on the board has a different path to each mic. Summed in mono, the delayed copy cancels at some frequencies — a comb.',
    why: {
      'The lower mic hears the board in reverse polarity': 'Neither is inverted here: the issue is arrival TIME.',
      'Two mics on one harp cancel each other completely in mono': 'They comb at some frequencies and add at others.',
    },
  },
  {
    id: 'hp.two.2',
    page: 'twoMic',
    prompt: 'You flip the lower mic’s polarity. What happens to the arrival-time difference?',
    options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so the two arrivals line up again in time', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Polarity reverses the signal’s sign; it does not remove a delay. The notches move; Δt does not.',
    why: {
      'It drops to zero, so the two arrivals line up again in time': 'Flipping polarity changes the sign, not when the sound arrives.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  },
  {
    id: 'hp.two.3',
    page: 'twoMic',
    prompt: 'Should the upper and lower spots be panned hard left and right?',
    options: ['Not necessarily: much of the harp’s range runs up and down', 'Yes: two spots on a harp make a stereo pair by their nature', 'Yes, so the bass sits on one side and the treble on the other'],
    correct: 'Not necessarily: much of the harp’s range runs up and down',
    explain: 'The harp’s registers are spread mostly vertically, so two spots need not be panned apart. A single natural mic can be stronger than a poorly balanced pair.',
    why: {
      'Yes: two spots on a harp make a stereo pair by their nature': 'Two spots support registers; they are not automatically a stereo pair.',
      'Yes, so the bass sits on one side and the treble on the other': 'The harp’s registers run up and down more than side to side.',
    },
  },
  {
    id: 'hp.two.4',
    page: 'twoMic',
    prompt: 'Does a harp need two mics?',
    options: ['Only if the second covers something the first misses', 'Yes: one mic cannot hear a harp’s whole range at all', 'Yes, whenever it is a pedal harp rather than a lever harp'],
    correct: 'Only if the second covers something the first misses',
    explain: 'One well-placed mic can be strong. Add a second spot only when it supports a register the first misses — and check the pair in mono.',
    why: {
      'Yes: one mic cannot hear a harp’s whole range at all': 'A well-placed mic — or a distant one — can give the whole harp.',
      'Yes, whenever it is a pedal harp rather than a lever harp': 'The harp’s type does not decide it. What the second mic adds does.',
    },
  },
  {
    id: 'hp.prac.gain',
    page: 'practice',
    prompt: 'Quiet plucks sit well below the overload light, but the strongest accents and glissandi light it. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until the accents sound clean', 'Ask the harpist to play the accents more softly during the concert'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set gain with headroom for the strongest playing. A lowered fader does not undo clipping at the input.',
    why: {
      'Pull the channel fader down until the accents sound clean': 'The overload happens at the input, before the fader.',
      'Ask the harpist to play the accents more softly during the concert': 'Set gain for the playing the music needs.',
    },
  },
  {
    id: 'hp.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second harp mic?',
    options: ['One mic misses a register, and the pair holds up in mono', 'Two channels give the mix engineer more options later on', 'The harp needs more level than one mic can give it'],
    correct: 'One mic misses a register, and the pair holds up in mono',
    explain: 'A second mic should solve a real problem — a missing register — and the pair should still sound full in mono.',
    why: {
      'Two channels give the mix engineer more options later on': 'More channels add spill, cables and a combining check.',
      'The harp needs more level than one mic can give it': 'Level comes from gain and the fader, not from another mic.',
    },
  },
  {
    id: 'hp.mix.1',
    page: 'practice',
    prompt: 'A starting point says “near the top of the pillar, looking down at the soundboard”. What sets the aim?',
    options: ['The mic’s axis points down toward the soundboard', 'The mic points straight up, away from the harp', 'The mic points along the pillar toward the floor'],
    correct: 'The mic’s axis points down toward the soundboard',
    explain: 'The position is near the pillar’s top; the aim is the soundboard. Two separate things — and a distance means something only with its surface.',
    why: {
      'The mic points straight up, away from the harp': 'It looks down at the board, not away from the harp.',
      'The mic points along the pillar toward the floor': 'The pillar is the place; the board is the aim.',
    },
  },
  {
    id: 'hp.mix.2',
    page: 'practice',
    prompt: 'A wedge sits about 125° off a supercardioid’s front axis. What can you expect?',
    options: ['Strong rejection on paper; in reality less, and least in the lows', 'Silence from the wedge, because it sits in the null', 'More wedge than straight behind the mic, where it rejects the most'],
    correct: 'Strong rejection on paper; in reality less, and least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less, and least at low frequencies.',
    why: {
      'Silence from the wedge, because it sits in the null': 'A null is infinitely deep only on paper.',
      'More wedge than straight behind the mic, where it rejects the most': 'A supercardioid has a small rear lobe; its deepest rejection is off the rear axis.',
    },
  },
  {
    id: 'hp.mix.3',
    page: 'practice',
    prompt: 'Two harp spots sound thin in mono. Which change removes the arrival-time difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning one mic up until it matches the other'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth.',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it does not remove the delay.',
      'Turning one mic up until it matches the other': 'Level changes the notches’ depth, not the delay.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'hp.sym.boom',
    observation: 'Bass or low mids boom',
    firstChecks: 'Mic too close to the board, directional proximity or the room: move outward or upward, change the harp’s room position.',
    options: ['Distance from the board and the pattern; move out or up', 'Boost the treble until the boom is balanced out', 'Push foam into the sound holes yourself to stop the boom quickly'],
    correct: 'Distance from the board and the pattern; move out or up',
    explain: 'Close to the board, a directional mic adds low end to the board’s resonance. Move out or up, try an omni, or move the harp in the room.',
    why: {
      'Boost the treble until the boom is balanced out': 'EQ hides the cause. Move the mic first.',
      'Push foam into the sound holes yourself to stop the boom quickly': 'Nothing goes into the harp without the owner’s agreement. Move the mic first.',
    },
  },
  {
    id: 'hp.sym.upper',
    observation: 'The upper notes disappear',
    firstChecks: 'The mic favours the low board or is off axis: shift toward an upper view, or test a spot near the pillar.',
    options: ['Which part of the board the mic faces; try an upper view', 'Turn the whole harp channel up until the top strings come back', 'Move the mic closer to the middle of the board'],
    correct: 'Which part of the board the mic faces; try an upper view',
    explain: 'A mic facing the low board hears it most. Shift up, or try a spot near the pillar’s top looking down.',
    why: {
      'Turn the whole harp channel up until the top strings come back': 'Level lifts the boom with the top. Change the view.',
      'Move the mic closer to the middle of the board': 'That tends to favour the low middle even more.',
    },
  },
  {
    id: 'hp.sym.noise',
    observation: 'Pedal or finger noise dominates',
    firstChecks: 'The close mic is too near the mechanism: increase the distance or change the viewing angle.',
    options: ['The distance from the hands and pedals; move out or turn', 'Ask the harpist to change pedals more slowly', 'Cut the low frequencies on the channel to hide the pedal thumps'],
    correct: 'The distance from the hands and pedals; move out or turn',
    explain: 'Close mics hear the hands and the pedals. Increase the distance or change the angle; then judge what is part of the performance.',
    why: {
      'Ask the harpist to change pedals more slowly': 'The pedals are part of the music. Change the mic.',
      'Cut the low frequencies on the channel to hide the pedal thumps': 'A filter thins the harp too. Change the position first.',
    },
  },
  {
    id: 'hp.sym.mono',
    observation: 'The stereo sum loses notes',
    firstChecks: 'Unequal arrival times from two mics: compare in mono, adjust the pair’s geometry.',
    options: ['Each mic alone, then the pair in mono; change the geometry', 'Flip one mic’s polarity and leave it that way for the whole concert', 'Pan the two mics harder apart to separate them'],
    correct: 'Each mic alone, then the pair in mono; change the geometry',
    explain: 'Two mics hearing the harp at different times comb in mono. Change the spacing, use a coincident pair, or one mic.',
    why: {
      'Flip one mic’s polarity and leave it that way for the whole concert': 'Polarity does not remove a delay. Fix the geometry.',
      'Pan the two mics harder apart to separate them': 'Panning does not change the mono sum.',
    },
  },
  {
    id: 'hp.sym.feedback',
    observation: 'Feedback on stage',
    firstChecks: 'The mic hears a monitor, the PA or the board’s resonance: lower the level, change the geometry, reduce the open mics.',
    options: ['Lower the level, then the geometry and the open mics', 'Keep the level up and cut the ringing frequency with EQ', 'Move the mic closer to the wedge to monitor it better'],
    correct: 'Lower the level, then the geometry and the open mics',
    explain: 'Bring the level down first; then aim the rejection, move the wedge, and close the mics you do not need. Never provoke feedback.',
    why: {
      'Keep the level up and cut the ringing frequency with EQ': 'Lower the level first. EQ is not a substitute for geometry.',
      'Move the mic closer to the wedge to monitor it better': 'That feeds more of the wedge into the mic.',
    },
  },
  {
    id: 'hp.sym.mount',
    observation: 'A mount rubs or threatens the finish',
    firstChecks: 'Unapproved contact or cable strain: stop and use an approved, non-damaging method.',
    options: ['Stop; use an approved holder and relieve the cable', 'Add more tape so the mount cannot move at all', 'Leave it until the end of the concert, then check'],
    correct: 'Stop; use an approved holder and relieve the cable',
    explain: 'Protect the instrument first: an approved holder, and cable relief so a pull never reaches the harp.',
    why: {
      'Add more tape so the mount cannot move at all': 'Tape on the finish is the risk. Use an approved holder.',
      'Leave it until the end of the concert, then check': 'Stop now, before it damages the finish.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'hp.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a one-mic harp setup in the order you would do them.',
    steps: [
      { text: 'Ask the harpist: the passages, the pedals or levers, what may touch the harp', early: 'Start with the harpist and the music.' },
      { text: 'Map their reach, view and feet; then listen where a mic might go', early: 'Map the space once you know the music.' },
      { text: 'Choose a mic whose specs suit, and a secure stand or an approved holder', early: 'Choose the mic once you know where it can go.' },
      { text: 'Place it, clear of the hands, the pedals and the harpist’s head', early: 'You need a chosen mic before you place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom', early: 'Power comes after the mic is placed and connected — outputs muted first.' },
      { text: 'Set input gain on quiet plucks AND the strongest passages, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Compare positions one change at a time, at matched levels and in mono', early: 'Compare only once the level is set safely.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'This channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point for this kind of mic, from the right surface', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, mount and cable stay clear of the harpist’s hands, feet, view and head', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on a harp', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
const CLOSE_REASON: SetupReason = { id: 'r.closest', label: 'Closest to the soundboard always gives the fullest harp', role: 'wrong', feedback: 'Closest tends to favour one region and boom; the whole harp blends with distance.' };

const setupTasks: SetupTask[] = [
  {
    id: 'hp.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A solo concert harp, a good recital hall, a recording. Two channels; phantom power is available.',
    setups: [
      { id: 'a', label: 'A spaced pair of omnis about 2 m or more away, toward the room’s centre, not too low', ok: true, power: 'phantom', feedback: 'A recommended solo starting point: the whole harp and the room — checked in mono.' },
      { id: 'b', label: 'One small condenser about 60 cm in front, aimed back at part of the board', ok: true, power: 'phantom', feedback: 'A recommended single-mic start: defined and practical.' },
      { id: 'c', label: 'A cardioid near the top of the pillar, looking down at the board', ok: true, power: 'phantom', feedback: 'A recommended spot — perhaps with a distant pair for the room.' },
      { id: 'd', label: 'A cardioid 5 cm from the middle of the board, for the most detail', ok: false, power: 'phantom', feedback: 'That close, a cardioid favours one region and booms — and crowds the harpist.' },
      { id: 'e', label: 'A boom over the harpist’s head, pointing down into the strings', ok: false, power: 'phantom', feedback: 'Nothing goes over the harpist’s head. Bring a spot in from the side.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.mono', label: 'I will check the pair in mono', role: 'optional', feedback: 'A fair reason for any spaced pair.' }, BRAND_REASON, CLOSE_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: a sensible starting point from its named surface, clearance from the harpist, and power that matches the mic.',
  },
  {
    id: 'hp.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A harp with a loud band on a club stage, a wedge for the harpist. One channel; phantom power is available.',
    setups: [
      { id: 'a', label: 'A cardioid about 60 cm in front, its rear toward the harpist’s wedge', ok: true, power: 'phantom', feedback: 'A recommended start, with the wedge aimed into its rejection.' },
      { id: 'b', label: 'An approved miniature omni at the second sound hole from the bottom', ok: true, power: 'phantom', feedback: 'A recommended live option, close and concealed — with the owner’s agreement.' },
      { id: 'c', label: 'A spaced pair of omnis 3 m away, to catch the whole harp', ok: false, power: 'phantom', feedback: 'On a loud stage a distant pair hears the band more than the harp.' },
      { id: 'd', label: 'A miniature taped inside a sound hole with foam around it', ok: false, power: 'phantom', feedback: 'No tape on the finish and no foam pushed in without the owner asking for it.' },
      { id: 'e', label: 'A cardioid right in the string plane at hand height', ok: false, power: 'phantom', feedback: 'That is where the harpist’s hands work. Keep to one side.' },
    ],
    reasons: [DOC_REASON, CLEAR_REASON, POWER_REASON, { id: 'r.null', label: 'Aiming its rejection toward the wedge helps gain before feedback', role: 'optional', feedback: 'A fair live reason — with the level down before any move.' }, BRAND_REASON, CLOSE_REASON],
    explain: 'Two setups pass. What passes is the reasoning: a sensible starting point, an approved mount, clearance from the harpist, and power that matches the mic.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: what makes most of a harp’s sound?', options: ['The string itself', 'The soundboard', 'The pillar'], after: 'Now STEP through the pluck (or PLAY ONCE) and watch the board.' },
  microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move a mic from 30 cm to 60 cm from the soundboard. What changes?', options: ['More boom', 'More of the whole harp', 'It depends on this harp'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will this cardioid, facing the harp, reject the harpist’s wedge best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip one mic’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Where are a harp’s sound holes?',
    options: ['In the back of the soundbox, toward the harpist', 'In the soundboard, under the strings', 'In the pillar, up near the crown at the top'],
    correct: 'In the back of the soundbox, toward the harpist',
    explain: 'The holes are in the soundbox’s back, facing the harpist; the soundboard is its front, where the strings are anchored.',
    why: {
      'In the soundboard, under the strings': 'The soundboard carries the strings; the holes are in the back.',
      'In the pillar, up near the crown at the top': 'The pillar is a solid column at the front.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What do a pedal harp’s pedals do?',
    options: ['Change the strings’ pitches as the harpist plays', 'Sustain the notes, like a piano’s pedal', 'Tilt the harp back onto the harpist’s right shoulder'],
    correct: 'Change the strings’ pitches as the harpist plays',
    explain: 'The pedals turn discs on the neck that change the strings’ pitches; a lever harp does that with levers on the neck.',
    why: {
      'Sustain the notes, like a piano’s pedal': 'A harp’s strings ring until a hand stops them; the pedals change pitches.',
      'Tilt the harp back onto the harpist’s right shoulder': 'The harpist tilts it by hand; the pedals change pitches.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'What moves most of the air when a harp string is plucked?',
    options: ['The soundboard, pulled by the string', 'The string, since it is what is plucked', 'The pillar, as it takes the strain'],
    correct: 'The soundboard, pulled by the string',
    explain: 'The string pulls on the board where it is anchored; the large, light board moves the air.',
    why: {
      'The string, since it is what is plucked': 'It moves little air on its own. The soundboard does that.',
      'The pillar, as it takes the strain': 'The pillar carries the pull; it does not radiate much.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A string is plucked exactly in its middle. Which of its shapes are left out?',
    options: ['The even ones (2, 4, 6 …): they are still at the middle', 'The odd ones (1, 3, 5 …): they are still at the middle', 'None: a pluck sets all of them going, wherever it is'],
    correct: 'The even ones (2, 4, 6 …): they are still at the middle',
    explain: 'Every even shape has a still point at the middle, so a pluck there cannot set it going; the odd ones move most there.',
    why: {
      'The odd ones (1, 3, 5 …): they are still at the middle': 'The reverse: the odd shapes move most at the middle.',
      'None: a pluck sets all of them going, wherever it is': 'A pluck on a shape’s still point cannot set that shape going.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'What must a harp mic and its stand never do?',
    options: ['Swing over the harp or the harpist’s head without a secure stand', 'Point toward the soundboard from in front of the harp, below the strings', 'Stand more than a metre or two away from the harp itself'],
    correct: 'Swing over the harp or the harpist’s head without a secure stand',
    explain: 'Nothing moves over the harp or the harpist’s head without a secure stand and a controlled path; stands and cables stay clear of the pedals, chair and hands.',
    why: {
      'Point toward the soundboard from in front of the harp, below the strings': 'That is a common starting point.',
      'Stand more than a metre or two away from the harp itself': 'A distant pair is a common solo choice.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your harp mic is rated to a very high maximum SPL. What does that tell you about a long, loud rehearsal next to the orchestra?',
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe for a while, as long as the music stays below the mic’s rating', 'It is safe as long as the mic is nearer the harp than you'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe for a while, as long as the music stays below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is nearer the harp than you': 'Where the mic sits says nothing about your ears.',
    },
  },
];

const wedges: Wedge[] = [
  {
    id: 'wedge.harp',
    label: 'the harpist’s wedge, downstage, facing the harp',
    short: 'HARP WEDGE',
    p: { x: 1300, y: 0, z: 250 },
    lift: 150,
    faces: { x: -1, y: 0, z: 0 },
    note: 'On the floor in front of the harp, facing back at the harpist: below and behind a front mic that looks down at the board — off its rear axis, where a supercardioid’s or hypercardioid’s deepest rejection lies.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
  },
  {
    id: 'wedge.other',
    label: 'another player’s wedge, off to the harpist’s left',
    short: 'OTHER WEDGE',
    p: { x: 1700, y: 0, z: -1300 },
    lift: 150,
    faces: { x: -0.8, y: 0, z: -0.6 },
    note: 'Off to the side, facing another player: well off a front mic’s axis, but on its open side — a pattern does little for it.',
    prov: { kind: 'illustrative', reason: 'a typical stage layout' },
  },
];

export const C10_LESSON: Lesson = {
  id: 'C10',
  labId: 'strings',
  title: 'Harp',
  subtitle: 'Concert pedal and lever harps: board, pillar and the room',
  noun: { one: 'harp', many: 'harps' },
  model: HARP_MODEL,
  micTypeIds: ['sdcCard', 'miniOmni'],
  zones: HARP_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A plucked string instrument: a frame of soundbox, neck and pillar holding a row of strings, the longest near the pillar and the shortest at the top of the soundbox. A concert pedal harp changes its strings’ pitches with seven pedals; a lever harp with levers on the neck.', src: 'LESSON' },
    { title: 'WHERE YOU MEET IT', text: 'Orchestras and pits, solo recitals, weddings and churches, folk and Celtic music, studios. This lesson covers studio recording and live sound; a harp with other performers belongs to the ensembles lab.', src: 'LESSON' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'Arpeggios, chords, melodies and glissandi across a wide range, quiet plucks to strong accents. Ask for the real passages — low bass notes, high strings, sweeps — before choosing a mic.', src: 'LESSON' },
    { title: 'ITS SIZE', text: 'A full-size pedal harp stands about 1.9 m tall, with strings from about 1.5 m long down to a few centimetres; lever harps are smaller. This lab draws a concert pedal harp and a smaller lever harp.', src: 'DPA-HARP' },
  ],
  sound: {
    stages: [
      { title: 'The finger pulls the string', text: 'The harpist’s finger pulls a string aside: it bends at the finger into two straight lengths, its ends held by the soundboard and the neck.' },
      { title: 'It lets go — the string swings', text: 'Released, the string swings back and forth (drawn many times larger, and in the picture’s plane — a harp string swings mostly across the row of strings).' },
      { title: 'It pulls on the soundboard', text: 'Anchored in the soundboard, the swinging string tugs on it; the thin board bows in and out with it. The air inside the soundbox is pushed and pulled too.' },
      { title: 'Sound leaves the harp', text: 'The soundboard sends sound out from its face — toward the strings and the room in front — and air from inside the box leaves through the holes in its back, toward the harpist.' },
      { title: 'A hand stops it', text: 'The string rings on until the harpist stops it with a hand. Dampings and pedal or lever changes are part of the performance — and of what a close mic hears.' },
    ],
    attack: 'The start of the sound: the finger’s pluck — with the fingers’ own small noises close to the strings. A mic near the strings and the hands tends to hear more of it.',
    body: 'The ring: the string, the soundboard and the air in the soundbox together, leaving from the board’s face and the holes in the back. A full harp is a large source, so a close mic hears part of it; around 2–3 m the whole instrument and the room blend. Both are tendencies, and harps vary.',
    head: { diameterMm: 0, rods: 0, label: 'not a drum: see the string’s shapes', strikeSrc: 'PHYS-STRING' },
  },
  setting: {
    items: [
      { id: 'harp', label: 'the harp (the lesson’s instrument)', short: 'HARP', note: 'Ringed in amber: the harp this lesson mics, with the harpist behind it, the soundbox on their right shoulder.', prov: { kind: 'sourced', src: 'DPA-HARP', quote: 'a full sized pedal harp with its 190 cm height' }, tag: 'THE HARP', scene: 'all' },
      { id: 'chair', label: 'the harpist and the chair', short: 'HARPIST', note: 'The harpist’s hands work both sides of the strings and their feet the pedals; they look past the neck at the music. Nothing goes in their reach, by their feet, across their view, or over their head.', prov: { kind: 'illustrative', reason: 'GEOMETRY_PROPOSAL' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'stand', label: 'the music stand', short: 'MUSIC', note: 'The harpist reads past the neck: a mic stand in that line is in the way, whatever it sounds like.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit' },
      { id: 'wedge.harp', label: 'the harpist’s wedge (monitor)', short: 'HARP WEDGE', note: 'A floor monitor in front of the harp, facing the harpist, so they hear the band.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'wedge.other', label: 'another player’s wedge', short: 'OTHER WEDGE', note: 'Off to one side, facing another player: loud, and heard by the harp mics.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'band', label: 'the rest of the band or orchestra', short: 'BAND', note: 'Louder than the harp, close by: their sound reaches every harp mic. Close placement and fewer open mics help the harp through.', prov: { kind: 'illustrative', reason: 'a generic band area' }, tag: 'SPILL', scene: 'stage' },
      { id: 'pa', label: 'the audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience hears some of the harp acoustically; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'pair', label: 'a spaced pair about 2 m away', short: 'SPACED PAIR', note: 'In a good room, a spaced pair of omnis about 2 m or more from a full-size harp, toward the room’s centre and not too low, blends the whole instrument with the room.', prov: { kind: 'sourced', src: 'DPA-HARP', quote: 'a distance of about 200 cm is recommended as minimum distance' }, tag: 'ROOM VIEW', scene: 'studio' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'The harp fits well between a corner and the centre of the room, the mics nearer the centre — move the harp and listen before committing.', prov: { kind: 'sourced', src: 'DPA-HARP', quote: 'the harp fits well between a corner and the center of the room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: monitors feed the players, the band is loud and the harp is quiet. Close placement, an aimed rejection, careful wedge placement and few open mics help it through.',
    studio: 'STUDIO: in a good room, the harp and the room can be the sound — move the harp and the listening position first, then a spaced pair about 2 m or more away; spots add definition if needed.',
  },
  diagnostic,
  practice: {
    task: 'Choose a harp setup for a given harp, room and performance, describe an alternative, and explain what would justify a second mic. With a real harp and the harpist’s and owner’s agreement, you can record what you tried below.',
    fields: [
      { id: 'harp', label: 'Harp (pedal or lever; size)', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser, cardioid', 'small condenser, omni', 'miniature omni', 'other'] },
      { id: 'zone', label: 'Starting position you tried', kind: 'text' },
      { id: 'distance', label: 'Distance, and from which surface', kind: 'text' },
      { id: 'pair', label: 'Second mic, and the mono check', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Clearances from the soundbox, the neck, the crown and the pillar, and the harpist’s reach and seat — ILLUSTRATIVE values for the owner to approve.', dims: ['hp', 'lv'] },
    { text: 'The soundboard’s lean (29°), the soundbox’s depth (30 cm to 11 cm) and top width, the base, the neck’s curve, the string lengths between the longest and the shortest (a drawing rule), the string counts (47 and 34).', dims: [] },
    { text: 'The five sound holes along the back (120 × 60 mm; the second from the bottom at 30 % of the board): their number and layout are drawing defaults.', dims: [] },
    { text: 'The seven pedals and their layout; the lever harp drawn at 0.75 of the pedal harp (about 1.4 m).', dims: [] },
    { text: 'The sizes come from museum instruments (an 1895 Erard, a Lyon & Healy of 1891–95) and the 1.9 m height from the research; a modern harp may differ.', dims: [] },
    { text: 'The bands round the guides’ figures (60 cm ± 15 cm, 30 cm ± 5 cm), the pillar zone’s extent, the behind zone’s heights, the miniature at the opening — the lab’s drawing. The miniature’s size is a drawing default.', dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every harp, harpist and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a concert pedal harp and a smaller lever harp with typical proportions, mic patterns and the two-mic comb as textbook shapes, and string and soundboard motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Nothing touches the harp without the owner’s agreement.',
  copy: HARP_COPY,
};
