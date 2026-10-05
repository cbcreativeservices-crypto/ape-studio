/**
 * M09 DRUM OVERHEADS — the lesson's pages as DATA (blueprint §7). The words
 * come from the owner's lesson (docs/labs/miking/source_text/Drum-Overheads-
 * Miking-Technique-Research.txt, cited "L<n>" in COMMENTS only) with the
 * fixes logged in docs/labs/miking/CORRECTIONS_LOG.md (O-01 …) applied.
 *
 * OWNER RULING 2026-10-04 — suggested starting points, never dogma; no source,
 * brand, model or person's name and no badge in learner text. The two-mic
 * method built on equal snare distance is "the floor-tom method"; the
 * 32-inch method is "the shoulder method" (the brief: descriptive names).
 * The research stays in docs/labs/miking/overheads/ and the code-only fields.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { CYMBAL_DRAWING_DEFAULTS } from '../shared/cymbals/cymbalSpec.ts';
import { DRUM_DRAWING_DEFAULTS } from '../shared/drums/drumSpec.ts';
import { M09_MODEL, M09_WEDGES } from './geometry.ts';
import { M09_ZONES } from './model.ts';
import { M09_COPY } from './copy.ts';

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the overheads',
    goal: 'Get to know what overheads are for and the kit they hear — every drum and cymbal, and the player’s space — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'Overheads are a point of view on the whole kit — the main picture, or mostly the cymbals. The cymbals hang closest to them, the snare is the usual reference, and the player’s space is theirs.',
  },
  sound: {
    title: 'How the kit reaches them',
    goal: 'See how a cymbal makes its sound and sends it out, and how every part of the kit reaches a point above it at a different moment. Shown, never played.',
    credit: { scenarios: ['oh.snd.1', 'oh.snd.2', 'oh.snd.3'], interactive: 'soundPath', note: 'Step the cymbal’s stroke through to the end (or play it once), and answer the three checks.' },
    takeaway: 'A cymbal’s whole plate rings and sends sound from both faces, the top one toward the overheads. Every source reaches a mic at a time set by its distance — about 34 cm per millisecond — so two mics hear each source at two different times.',
  },
  setting: {
    title: 'Where they sit',
    goal: 'Know what surrounds the overheads — the cymbals they hang near, the snare they measure to, the player’s space — and what a stage and a studio add.',
    credit: { scenarios: ['oh.set.1', 'oh.set.2', 'oh.set.3'], note: 'Answer the three checks.' },
    takeaway: 'Nothing hangs over the player without a sturdy, counterweighted stand, and nothing goes in the sticks’ reach or a cymbal’s swing. Ask the player to play first, and protect your hearing.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose overhead mics by their properties — pattern, power, size, how they are addressed and mounted — not by brand.',
    credit: { scenarios: ['oh.mic.1', 'oh.mic.2', 'oh.mic.3', 'oh.mic.4', 'oh.rec.1'], note: 'Answer the five checks (one reaches back to how the kit sounds).' },
    takeaway: 'Pattern decides how much room and how much of the kit around a mic it hears; a side-address mic is aimed with its face. No brand or type is required — small condensers are common, not compulsory.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin — measured to the snare, aimed at it, clear of the player and the cymbals — then move the mic and see what changes.',
    credit: { scenarios: ['oh.place.1', 'oh.place.2', 'oh.place.3', 'oh.rec.2'], interactive: 'twoZones', note: 'Rest a mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
    takeaway: 'A recommended zone is a place to begin, measured from a named reference — usually the snare’s centre. Height, position, aim and spacing are separate things to try, and clearance comes first.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a side mic so its pattern’s rejection faces a loud monitor — and know what overheads are for on a stage.',
    credit: { scenarios: ['oh.ctx.1', 'oh.ctx.2', 'oh.ctx.studio', 'oh.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: tilt or turn the side mic (or change its pattern) until the drum fill sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
    takeaway: 'Live, start from what the audience already hears; an overhead adds cymbals and stage spill. Stereo suits a stereo system. Real nulls are shallower than the picture, and no mic position alone prevents feedback.',
  },
  twoMic: {
    title: 'Two overheads',
    goal: 'Measure two overheads to the snare, see what equal snare distance lines up — and what it does not — and compare the common stereo pairs.',
    credit: { scenarios: ['oh.two.1', 'oh.two.2', 'oh.two.3', 'oh.two.4'], interactive: 'snareMatched', note: 'Move a mic so the snare distances differ, bring them level again, and look at the kick as a source; then answer the four checks.' },
    takeaway: 'Equal snare distance lines up the snare — nothing else. A coincident pair adds no time difference of its own; a spaced pair adds width and arrival differences. Polarity flips the sign; it never removes a delay. Listen in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the physical cause first — position, aim, the distances to the loud sources, clearance and gain — before reaching for tone controls or pan.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up overheads in the right order, choose and justify a method for two different briefs, and say what would justify close spot mics.',
    credit: { scenarios: ['oh.prac.order', 'oh.prac.gain', 'oh.prac.setup1', 'oh.prac.setup2', 'oh.prac.3', 'oh.mix.1', 'oh.mix.2', 'oh.mix.3'], note: 'Put the setup in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real kit.' },
    takeaway: 'Safe mounting, power and gain set in order, a method chosen for the role and the outputs, distances measured to the snare and a mono check pass. A brand or the widest pair does not — and more than one method can pass.',
  },
};

/*
 * THE CHECKS. Every item tests reasoning; every wrong option is a real
 * misconception with its own explanation. Source lines in comments only:
 * oh.snd.* L3, L59, L61 · oh.set.* L7, L10-L11 · oh.mic.* L61 · oh.place.*
 * L45-L49, L59 · oh.ctx.* L67-L87 · oh.two.* L55, L63-L66, L117 · oh.prac.* L88-L95.
 */
const scenarios: MikingScenario[] = [
  {
    id: 'oh.snd.1',
    page: 'sound',
    prompt: 'A stick strikes a crash on its bow. Where does the cymbal’s sound leave it?',
    options: ['From the whole plate, top face and underside', 'Only from the edge, where a crash is usually struck', 'Mostly from the bell, its thickest and stiffest part'],
    correct: 'From the whole plate, top face and underside',
    explain: 'The whole plate rings and pushes air from both faces — up toward the overheads, down toward the drums. In its ringing shapes the edge tends to move most.',
    why: {
      'Only from the edge, where a crash is usually struck': 'The edge moves most in many of its shapes, but the whole plate rings and radiates, from both faces.',
      'Mostly from the bell, its thickest and stiffest part': 'The bell is held near the felts and moves least in the plate’s ringing shapes; the bow and edge radiate much of the sound.',
    },
  },
  {
    id: 'oh.snd.2',
    page: 'sound',
    prompt: 'A point above the kit is 1.0 m from the snare and 1.5 m from the kick, both struck together. Which arrives first?',
    options: ['The snare, about 1.5 ms before the kick', 'The kick, since low sound travels faster', 'Both at once, as the strokes were together'],
    correct: 'The snare, about 1.5 ms before the kick',
    explain: 'Sound travels at about 343 m/s at 20 °C — about 34 cm per millisecond — whatever its pitch. Half a metre farther is about 1.5 ms later.',
    why: {
      'The kick, since low sound travels faster': 'Low and high sounds travel at the same speed in air. Only the distance sets the arrival time.',
      'Both at once, as the strokes were together': 'Struck together, they still travel different distances: the farther source arrives later.',
    },
  },
  {
    id: 'oh.snd.3',
    page: 'sound',
    prompt: 'Why does a stick on the bell drive the cymbal’s ringing shapes less than a stick on the bow?',
    options: ['It lands near the held centre, where these shapes barely move', 'The bell is a separate part, so its motion stays out of the plate', 'A stroke on the bell is harder, which stops the plate ringing'],
    correct: 'It lands near the held centre, where these shapes barely move',
    explain: 'A stroke drives a shape as much as the plate moves where the stick lands. The shapes a centre-held cymbal rings in barely move near the centre. The bell still has a sound of its own — a tendency to hear, not a rule.',
    why: {
      'The bell is a separate part, so its motion stays out of the plate': 'The bell is part of the same plate. It sits near the held centre, where the ringing shapes barely move.',
      'A stroke on the bell is harder, which stops the plate ringing': 'How hard the stroke is changes the level, not which shapes it can drive. Where it lands is what matters here.',
    },
  },
  {
    id: 'oh.set.1',
    page: 'setting',
    prompt: 'An overhead has to sit high above the kit. What should hold it there?',
    options: ['A counterweighted boom stand, its base outside the kit', 'A light stand leaned on the ride stand to save space', 'A cable tie to the venue’s lighting bar, which is closer'],
    correct: 'A counterweighted boom stand, its base outside the kit',
    explain: 'Use stands and counterweights made for the load, the base outside the kit, nothing balanced over the player. Hanging gear from a venue’s structure needs the venue’s approval and qualified people.',
    why: {
      'A light stand leaned on the ride stand to save space': 'A stand leaning on another can tip into the player or the cymbals. Use a stand made for the load, counterweighted, on its own base.',
      'A cable tie to the venue’s lighting bar, which is closer': 'A venue’s structure is not yours to hang from: that needs the venue’s approval and qualified people.',
    },
  },
  {
    id: 'oh.set.2',
    page: 'setting',
    prompt: 'Before you place any overhead, what do you ask the drummer to do?',
    options: ['Play grooves and fills at show level, using each cymbal', 'Play softly, so the mics are spared the loudest strokes', 'Leave the cymbals out until the drums sound right'],
    correct: 'Play grooves and fills at show level, using each cymbal',
    explain: 'Hear the whole kit as it will be played — each cymbal, the hi-hat foot, snare accents, tom fills — then decide what the overheads are for.',
    why: {
      'Play softly, so the mics are spared the loudest strokes': 'The balance and the levels change with how hard the kit is played. Listen at the level of the show.',
      'Leave the cymbals out until the drums sound right': 'Overheads hear the cymbals most of all; leaving them out hides the very balance you are setting.',
    },
  },
  {
    id: 'oh.set.3',
    page: 'setting',
    prompt: 'You will sit beside a loud kit through a long soundcheck. What protects your hearing?',
    options: ['Keeping the level and time down where you are, and hearing protection', 'Standing behind the overhead stands, which block most of the kit’s sound', 'Nothing more — the mics’ maximum SPL keeps the level in a safe range'],
    correct: 'Keeping the level and time down where you are, and hearing protection',
    explain: 'Hearing risk depends on the level where you are and for how long: a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more. A mic’s maximum SPL is its own distortion limit.',
    why: {
      'Standing behind the overhead stands, which block most of the kit’s sound': 'Thin stands block almost nothing. Limit the level and the time where you are, and use hearing protection.',
      'Nothing more — the mics’ maximum SPL keeps the level in a safe range': 'Maximum SPL says when a MIC distorts. It has nothing to do with what your ears can take.',
    },
  },
  {
    id: 'oh.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · A mic about 1 m above the snare: which part of the kit is usually closest to it?',
    options: ['The cymbals, which hang highest', 'The kick, the largest of the drums', 'The floor tom, the deepest drum'],
    correct: 'The cymbals, which hang highest',
    explain: 'Cymbals hang highest, so a mic above the kit is closest to them — one reason height changes the balance of cymbals and drums.',
    why: {
      'The kick, the largest of the drums': 'Size is not distance: the kick sits on the floor in the middle, the farthest source from a mic above the kit.',
      'The floor tom, the deepest drum': 'The floor tom’s head is low, under the ride: the cymbals above it are closer to an overhead.',
    },
  },
  {
    id: 'oh.mic.1',
    page: 'microphone',
    prompt: 'The overheads should bring in the room as well as the kit. Which pattern is a natural first try?',
    options: ['Omni — it hears all round, room included', 'Cardioid — it reaches deeper into the room', 'Supercardioid — its rear lobe hears the room'],
    correct: 'Omni — it hears all round, room included',
    explain: 'An omni picks up from every direction, so it hears more of the room; a cardioid favours what it faces. A pattern chooses directions — it does not reach farther.',
    why: {
      'Cardioid — it reaches deeper into the room': 'A pattern does not reach farther; a cardioid favours its front and rejects its back, so it hears less of the room than an omni.',
      'Supercardioid — its rear lobe hears the room': 'Its small rear lobe hears a little behind, but it is still more directional than a cardioid — the opposite of hearing the room.',
    },
  },
  {
    id: 'oh.mic.2',
    page: 'microphone',
    prompt: 'A side-address condenser goes over the kit. Which part of it faces the kit?',
    options: ['The face of its body, from the side', 'Its end, the way a pencil mic is aimed', 'Whichever side: a condenser hears all round'],
    correct: 'The face of its body, from the side',
    explain: 'A side-address mic hears out of the side of its body — its front face. Aim the face at the kit; the end points elsewhere.',
    why: {
      'Its end, the way a pencil mic is aimed': 'That is an end-address mic. A side-address mic is aimed with the face of its body.',
      'Whichever side: a condenser hears all round': 'Being a condenser says nothing about the pattern; this one is a cardioid, aimed with its face.',
    },
  },
  {
    id: 'oh.mic.3',
    page: 'microphone',
    prompt: 'The only spare inputs have no phantom power. Which of this page’s mics can you use as overheads?',
    options: ['None of these: each needs phantom power', 'The large one, since its capsule is bigger', 'The pencils, as they draw so little power'],
    correct: 'None of these: each needs phantom power',
    explain: 'Both types here are condensers and need phantom power. Find powered inputs, or choose another kind of mic.',
    why: {
      'The large one, since its capsule is bigger': 'A bigger capsule does not remove the need for power: a condenser needs phantom power.',
      'The pencils, as they draw so little power': 'Little is not none: without phantom power these condensers will not work.',
    },
  },
  {
    id: 'oh.mic.4',
    page: 'microphone',
    prompt: 'Someone says a dynamic mic cannot work as an overhead. What is the best reply?',
    options: ['It can: choose by pattern, level and what you hear', 'Right — only a condenser can pick up a cymbal’s high detail', 'Right — a dynamic has to sit right at a drum'],
    correct: 'It can: choose by pattern, level and what you hear',
    explain: 'Small condensers are a common overhead choice, but no type is required. Choose by properties and test by ear.',
    why: {
      'Right — only a condenser can pick up a cymbal’s high detail': 'Any working mic picks up a cymbal. Mic types sound different — compare them by ear.',
      'Right — a dynamic has to sit right at a drum': 'Dynamics are often used close, but nothing stops one working at a distance; check its level and sound.',
    },
  },
  {
    id: 'oh.place.1',
    page: 'placement',
    prompt: 'Your two overheads are 1.02 m and 1.13 m from the snare’s centre. What does that change?',
    options: ['The snare reaches one mic about 0.3 ms later', 'Nothing yet — only the mics’ height changes the snare', 'The snare gets louder in the farther mic'],
    correct: 'The snare reaches one mic about 0.3 ms later',
    explain: '0.11 m is about 0.3 ms at 343 m/s. Summed, that delay notches the snare — matching the two distances is the usual starting check.',
    why: {
      'Nothing yet — only the mics’ height changes the snare': 'The distance to the snare sets when it arrives, whatever the height. Unequal distances mean unequal arrival times.',
      'The snare gets louder in the farther mic': 'Farther away is a little quieter, not louder — and later. The time difference is what notches the sum.',
    },
  },
  {
    id: 'oh.place.2',
    page: 'placement',
    prompt: 'You raise the mic over the snare from about 1 m to about 1.2 m. What is a common tendency?',
    options: ['More cymbals and room, less close drum sound', 'More kick, as the mic gets closer to it', 'No change: height only matters for the ceiling'],
    correct: 'More cymbals and room, less close drum sound',
    explain: 'Higher tends to bring in more cymbals and room; lower, more drums. A tendency to check on this kit and in this room.',
    why: {
      'More kick, as the mic gets closer to it': 'Raising the mic moves it AWAY from the kick, which sits on the floor.',
      'No change: height only matters for the ceiling': 'Height changes the distances to every source — and so the balance. Clearance to the ceiling is a separate check.',
    },
  },
  {
    id: 'oh.place.3',
    page: 'placement',
    prompt: 'The side mic matches the snare distance, but it sits where the drummer’s stick can reach it. What now?',
    options: ['Move it clear first, then match the distance again', 'Keep it there: the matched distance matters most of all', 'Ask the drummer to play that tom more gently'],
    correct: 'Move it clear first, then match the distance again',
    explain: 'Clearance comes first; the matched distance is only a starting check. If a position cannot be both clear and matched, choose another position or another method.',
    why: {
      'Keep it there: the matched distance matters most of all': 'A measured distance never outranks the player’s space. Move it, then measure again.',
      'Ask the drummer to play that tom more gently': 'The player plays the music; the mic moves. Keep every mic out of the sticks’ reach.',
    },
  },
  {
    id: 'oh.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Where does an overhead’s boom stand go?',
    options: ['Its base outside the kit, its boom clear of the player', 'Between the kick and the floor tom, as near the mic as fits', 'Behind the throne, its boom out over the drummer'],
    correct: 'Its base outside the kit, its boom clear of the player',
    explain: 'The base stands outside the kit and the player’s space; the boom stays out of the sticks’ reach and the cymbals’ swing, counterweighted — nothing balanced over the player.',
    why: {
      'Between the kick and the floor tom, as near the mic as fits': 'Inside the kit the stand is in the player’s and the drums’ way. Stand it outside and let the boom reach in.',
      'Behind the throne, its boom out over the drummer': 'Over the player is exactly where a boom should not hang. Keep it clear of the head, shoulders and sticks.',
    },
  },
  {
    id: 'oh.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · A cymbal sends its sound out from which faces?',
    options: ['Both: up to the overheads, down to the drums', 'Only the top, toward the overheads above it', 'Only the edge, where the plate is thinnest'],
    correct: 'Both: up to the overheads, down to the drums',
    explain: 'The whole plate rings and pushes air from both faces — so a cymbal reaches the overheads above it, and the close mics below it too.',
    why: {
      'Only the top, toward the overheads above it': 'The underside moves the air too: the close mics under a cymbal hear it, which is part of why cymbals spill into everything.',
      'Only the edge, where the plate is thinnest': 'The edge moves most in many shapes, but the whole plate radiates, from both faces.',
    },
  },
  {
    id: 'oh.ctx.1',
    page: 'context',
    prompt: 'On a loud stage the audience already hears the cymbals from the kit. What might the overheads still be for?',
    options: ['Adding what the PA needs, or feeding a recording', 'Making the cymbals louder, whatever the room and the band', 'Standing in for the close mics on the drums'],
    correct: 'Adding what the PA needs, or feeding a recording',
    explain: 'Start from what the audience already hears. An overhead may add cymbals or detail — or feed a recording or broadcast — at the cost of stage spill.',
    why: {
      'Making the cymbals louder, whatever the room and the band': 'If the audience already hears the cymbals, more of them may only make the sound harsher — and costs gain before feedback.',
      'Standing in for the close mics on the drums': 'On a loud stage, overheads are far from the drums and full of spill: close mics usually carry the drums.',
    },
  },
  {
    id: 'oh.ctx.2',
    page: 'context',
    prompt: 'The PA is mono. Is a wide spaced pair the natural overhead choice?',
    options: ['Not by default: one overhead may be simpler', 'Yes: a spaced pair sounds wider in mono too', 'Yes, if the pair is panned hard left and right'],
    correct: 'Not by default: one overhead may be simpler',
    explain: 'Stereo techniques suit a stereo system. In a mono PA a single overhead may be simpler, and a spaced pair summed to mono can colour the kit.',
    why: {
      'Yes: a spaced pair sounds wider in mono too': 'Summed to mono there is no width — and a spaced pair’s arrival differences can colour the sound.',
      'Yes, if the pair is panned hard left and right': 'A mono PA sums the pan positions back together, so panning changes nothing there.',
    },
  },
  {
    id: 'oh.ctx.studio',
    page: 'context',
    prompt: 'Studio, a good-sounding room, no monitors. What could justify raising the overheads or spacing them wider?',
    options: ['The room adds something you want in the kit', 'Higher mics pick up a louder kit overall', 'Wider mics take the spill out between drums'],
    correct: 'The room adds something you want in the kit',
    explain: 'In a good room, a higher or wider pair can bring in a useful amount of it — checked by ear, at matched levels, and in mono.',
    why: {
      'Higher mics pick up a louder kit overall': 'Farther from the kit, the mics pick up LESS of it directly and more of the room.',
      'Wider mics take the spill out between drums': 'Overheads hear everything; spacing changes width and arrival times, not spill.',
    },
  },
  {
    id: 'oh.two.1',
    page: 'twoMic',
    prompt: 'The floor-tom method’s two mics are both 1.02 m from the snare’s centre. Are they the same distance from the kick?',
    options: ['No — here about 1.46 m and 0.90 m', 'Yes — equal for the snare, equal for all', 'Yes, as long as both are the same model'],
    correct: 'No — here about 1.46 m and 0.90 m',
    explain: 'Equal snare distance lines up the snare only. The kick, toms and cymbals still reach the two mics at different times — about 1.6 ms apart for the kick here.',
    why: {
      'Yes — equal for the snare, equal for all': 'Each source has its own two distances. Matching the snare’s says nothing about the kick’s.',
      'Yes, as long as both are the same model': 'The model changes the sound, not the distances. Arrival times follow the geometry alone.',
    },
  },
  {
    id: 'oh.two.2',
    page: 'twoMic',
    prompt: 'You flip the side mic’s polarity and the kick sounds fuller. Has the delay been removed?',
    options: ['No: polarity flips the sign; the delay stays', 'Yes: inverting polarity lines the mics up', 'Yes, but only for the kick’s lowest notes'],
    correct: 'No: polarity flips the sign; the delay stays',
    explain: 'Polarity inversion reverses the signal’s sign. It moves the notches; it does not remove a delay caused by different distances. Compare both states at matched levels.',
    why: {
      'Yes: inverting polarity lines the mics up': 'Polarity is not a time alignment: the later arrival is still later.',
      'Yes, but only for the kick’s lowest notes': 'The delay is the same at every pitch; polarity only moves where the notches fall.',
    },
  },
  {
    id: 'oh.two.3',
    page: 'twoMic',
    prompt: 'Which pair is least likely to colour the kit when summed to mono?',
    options: ['A coincident X/Y pair, capsules together', 'A spaced pair, each 1.2 m from the snare', 'The floor-tom method’s mic above and side mic'],
    correct: 'A coincident X/Y pair, capsules together',
    explain: 'Coincident capsules hear each source at the same moment, so the pair itself adds no time difference. It does not fix differences with the close mics.',
    why: {
      'A spaced pair, each 1.2 m from the snare': 'Equal snare distance lines up the snare only; every other source arrives at two times, which can colour the mono sum.',
      'The floor-tom method’s mic above and side mic': 'Matched to the snare, but far apart: the kick, toms and cymbals arrive at different times.',
    },
  },
  {
    id: 'oh.two.4',
    page: 'twoMic',
    prompt: 'A spaced pair sounds thin in mono. What do you check first?',
    options: ['Each loud source’s two distances, then the spacing', 'The pan positions — wider panning fixes the mono sound', 'The brand of the mics, since mono depends on it'],
    correct: 'Each loud source’s two distances, then the spacing',
    explain: 'Compare the distances for the snare and the other loud sources, change the spacing or position, and consider a coincident pair if mono matters most.',
    why: {
      'The pan positions — wider panning fixes the mono sound': 'Mono sums the two channels whatever the pan; the cause is the arrival difference.',
      'The brand of the mics, since mono depends on it': 'Mono problems come from geometry — distances and arrival times — not from a brand.',
    },
  },
  {
    id: 'oh.prac.gain',
    page: 'practice',
    prompt: 'The crashes light the overload indicator on the overhead channels. What do you do?',
    options: ['Lower the input gain, or use a pad its manual allows', 'Pull the faders down until the crashes sound clean', 'Ask the drummer to play the crashes more gently'],
    correct: 'Lower the input gain, or use a pad its manual allows',
    explain: 'Set input gain with headroom for the loudest playing — crashes included — watching the overload indicator. A lowered fader does not undo clipping at the input.',
    why: {
      'Pull the faders down until the crashes sound clean': 'The overload happens before the fader; turning the fader down only makes the distorted signal quieter.',
      'Ask the drummer to play the crashes more gently': 'The drummer plays the music; set the gain for it, with headroom.',
    },
  },
  {
    id: 'oh.prac.3',
    page: 'practice',
    prompt: 'What would justify adding close kick and snare mics to the floor-tom method?',
    options: ['The part needs their own weight and attack, and the blend holds up', 'Two overheads miss the kick completely, so it needs a mic of its own', 'More channels give the mixing engineer a better result in the end'],
    correct: 'The part needs their own weight and attack, and the blend holds up',
    explain: 'Add spot mics one at a time, for a reason, and check the blend in mono with the two main mics. If the drums thin out or shift sideways, adjust — or leave them out.',
    why: {
      'Two overheads miss the kick completely, so it needs a mic of its own': 'The overheads do hear the kick, just later and weaker. A kick mic adds its own weight and control.',
      'More channels give the mixing engineer a better result in the end': 'Each open mic adds spill and arrival differences; add a channel for a reason.',
    },
  },
  {
    id: 'oh.mix.1',
    page: 'practice',
    prompt: 'A starting point says “about 1 m above the snare”. What else do you need before placing the mic?',
    options: ['How it is aimed, and that player and cymbals are clear', 'The brand of the snare, so that the number fits that drum', 'Nothing more: the number places the mic exactly'],
    correct: 'How it is aimed, and that player and cymbals are clear',
    explain: 'A distance belongs to its reference; a starting point may also name an aim; clearance is a separate check.',
    why: {
      'The brand of the snare, so that the number fits that drum': 'The reference is the snare’s centre, whatever the brand.',
      'Nothing more: the number places the mic exactly': 'A number is a place to begin — the aim and the clearance still have to be set, and then you listen.',
    },
  },
  {
    id: 'oh.mix.2',
    page: 'practice',
    prompt: 'A cardioid side mic’s rear faces the drum fill. What can you expect?',
    options: ['Some rejection, less than the picture, least in the lows', 'Silence from the fill, since it sits right behind the mic', 'More of the fill than of the snare it is aimed at'],
    correct: 'Some rejection, less than the picture, least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, least at low frequencies — use the null to aim, not to promise silence.',
    why: {
      'Silence from the fill, since it sits right behind the mic': 'Real rejection is limited, and the stage reflects the fill’s sound from other directions too.',
      'More of the fill than of the snare it is aimed at': 'Facing away, the fill is turned down — just not to silence.',
    },
  },
  {
    id: 'oh.mix.3',
    page: 'practice',
    prompt: 'The overheads and the close snare make the snare hollow together. Which change removes the arrival difference itself?',
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity of the close snare mic', 'Raising the snare mic to cover the overheads'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
    why: {
      'Flipping the polarity of the close snare mic': 'Polarity flips the sign; the snare still arrives at the overheads later.',
      'Raising the snare mic to cover the overheads': 'Level changes how deep the notches are, not where the delay comes from.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.hat',
    observation: 'The hi-hat or a crash swamps one side of the pair',
    firstChecks: 'Move or re-aim the array and inspect capsule distance to that cymbal; review the stereo centre and the drummer’s balance.',
    options: ['Move or re-aim the pair; check each mic’s distance to that cymbal', 'Turn that whole side of the pair down until that cymbal sits back', 'Ask the drummer to take that cymbal off the kit'],
    correct: 'Move or re-aim the pair; check each mic’s distance to that cymbal',
    explain: 'One mic is much closer to that cymbal. Move or re-aim the pair, check the stereo centre — and the player’s own balance.',
    why: {
      'Turn that whole side of the pair down until that cymbal sits back': 'Turning a side down moves the whole image off centre; fix the distance to the cymbal first.',
      'Ask the drummer to take that cymbal off the kit': 'The kit is the player’s. Move the mics before asking for changes.',
    },
  },
  {
    id: 's.snareSide',
    observation: 'The snare pulls to one side when the close snare mic comes up',
    firstChecks: 'Inspect the overhead audio centre, level and aim; compare left/right capsule distance to the snare and the intended panning.',
    options: ['The pair’s centre and its two snare distances, then panning', 'Pan the close snare mic hard to the other side to balance it', 'Invert the polarity of both overheads at the same time'],
    correct: 'The pair’s centre and its two snare distances, then panning',
    explain: 'If one overhead is nearer the snare, the snare leans that way. Centre the pair on the line through the kick and the snare, and match the snare distances.',
    why: {
      'Pan the close snare mic hard to the other side to balance it': 'That hides the cause and smears the snare across the image. Check the overheads’ distances first.',
      'Invert the polarity of both overheads at the same time': 'Inverting both changes nothing between them; the snare still leans toward the nearer mic.',
    },
  },
  {
    id: 's.mono',
    observation: 'A spaced pair sounds thin or uneven in mono',
    firstChecks: 'Compare arrival distances for snare and other prominent sources, change spacing or position, and consider X/Y.',
    options: ['The arrival distances of the loud sources; spacing or a coincident pair', 'Add a third overhead between the two to fill in the middle', 'Boost the low end on both overheads until the whole kit sounds full again'],
    correct: 'The arrival distances of the loud sources; spacing or a coincident pair',
    explain: 'Equal snare distance is not a whole-kit guarantee: check the others too, and try another spacing or a coincident pair if mono matters most.',
    why: {
      'Add a third overhead between the two to fill in the middle': 'A third mic adds a third set of arrival times — usually more combing, not less.',
      'Boost the low end on both overheads until the whole kit sounds full again': 'EQ cannot undo notches set by arrival differences; fix the geometry first.',
    },
  },
  {
    id: 's.roomy',
    observation: 'The pair sounds too roomy or distant',
    firstChecks: 'Evaluate room and reflective surfaces; move safely closer or re-aim toward the kit, or use a more focused pattern.',
    options: ['The room and nearby surfaces; move closer or aim at the kit', 'Turn the overheads up until the whole kit sounds close to you again', 'Switch both mics to omni so they hear more of the kit'],
    correct: 'The room and nearby surfaces; move closer or aim at the kit',
    explain: 'Closer (safely) and aimed at the kit, or a more focused pattern, brings the kit forward against the room.',
    why: {
      'Turn the overheads up until the whole kit sounds close to you again': 'Louder keeps the same balance of kit and room: the position sets the balance.',
      'Switch both mics to omni so they hear more of the kit': 'An omni hears MORE of the room, not less.',
    },
  },
  {
    id: 's.feedback',
    observation: 'Feedback or stage spill when the overheads come up live',
    firstChecks: 'Lower or omit unnecessary overhead gain, test pattern and position relative to monitors and other sources, and assess what the PA needs.',
    options: ['Overhead gain, the pattern and position against the monitors, and what the PA needs', 'Raise the overheads until the cymbals cut through the rest of the band', 'Point the overheads at the wedges briefly to hear what they pick up'],
    correct: 'Overhead gain, the pattern and position against the monitors, and what the PA needs',
    explain: 'Lower or leave out overhead gain the PA does not need; check the pattern and position against the monitors. Never provoke feedback to find it.',
    why: {
      'Raise the overheads until the cymbals cut through the rest of the band': 'More gain is exactly what brings feedback closer. Start from what the PA needs.',
      'Point the overheads at the wedges briefly to hear what they pick up': 'That invites feedback. Never provoke it deliberately.',
    },
  },
  {
    id: 's.boom',
    observation: 'A boom or a cable is in the player’s path',
    firstChecks: 'Stop; secure and reposition the assembly, route cable safely, and repeat the player’s full-motion clearance check.',
    options: ['Stop the drummer; secure, move and reroute; check clearance again', 'Keep going carefully and fix it at the end of the song', 'Tape the cable along the cymbal’s boom so it stays out of the player’s reach'],
    correct: 'Stop the drummer; secure, move and reroute; check clearance again',
    explain: 'Clearance comes first: stop, fix the mount and the cable route, and have the drummer show their full movement again.',
    why: {
      'Keep going carefully and fix it at the end of the song': 'A boom in the player’s path can be struck at any moment. Stop now.',
      'Tape the cable along the cymbal’s boom so it stays out of the player’s reach': 'The cymbal’s boom moves and swings; route the cable along the mic’s own stand, away from the player.',
    },
  },
];

/** The practical setup procedure (L88-L95), with the power and gain rules (L11). */
const orderTasks: OrderTask[] = [
  {
    id: 'oh.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of an overhead setup in the order you would do them.',
    steps: [
      { text: 'Hear the whole kit at show level; decide what the overheads are for', early: 'Start with the kit, the music and the role.' },
      { text: 'Choose one mic or a stereo method that suits the role and the outputs', early: 'Choose once you know the role and whether the outputs are mono or stereo.' },
      { text: 'Have the drummer stop; mount the mics and cables; check clearance', early: 'You need chosen mics before you can mount them.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom on', early: 'Power comes after the mics are mounted and cabled — with the outputs muted first.' },
      { text: 'Set input gain on the loudest playing, crashes included, with headroom', early: 'Gain is set once the mics are powered.' },
      { text: 'Measure to the snare; compare height, position and aim, one at a time', early: 'Compare only once the levels are safe — one change at a time.' },
      { text: 'Add close mics, check mono, and re-check clearance with full motion', early: 'Close mics come once the overhead picture works.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it for the loudest playing, crashes included, with headroom.',
  },
];

const DOC: SetupReason = { id: 'r.doc', label: 'It is a recommended starting point, measured to the snare’s centre', role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' };
const CLEAR: SetupReason = { id: 'r.clear', label: 'Mics, booms and cables stay clear of the sticks, the cymbals’ swing and the player', role: 'required', feedback: 'Clearance is part of every passing setup.' };
const BRAND: SetupReason = { id: 'r.brand', label: 'It is the pair most engineers buy for drums', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties and by ear.' };
const WIDE: SetupReason = { id: 'r.wide', label: 'The widest pair gives the best drum sound', role: 'wrong', feedback: 'Width is a choice for the music, not a measure of quality — and wide pairs need the most care in mono.' };

const setupTasks: SetupTask[] = [
  {
    id: 'oh.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · Studio. The drummer wants a natural whole-kit picture; close kick and snare mics are already up; the mix may be heard in mono. Two channels for overheads; phantom power is available.',
    setups: [
      { id: 'a', label: 'A coincident X/Y pair over the snare, capsules angled about 90° apart, not touching', ok: true, power: 'phantom', feedback: 'A compact image with no time difference inside the pair — a safe start when mono matters.' },
      { id: 'b', label: 'The floor-tom method: a mic about 1 m over the snare and a side mic at the same snare distance', ok: true, power: 'phantom', feedback: 'A whole-kit picture with two mics, the snare lined up by the matched distances — then check the rest of the kit in mono.' },
      { id: 'c', label: 'A spaced pair, each about 1.2 m from the snare’s centre, checked in mono', ok: true, power: 'phantom', feedback: 'Width with the snare lined up; the mono check covers the other sources.' },
      { id: 'd', label: 'A spaced pair set by eye, one mic much nearer the snare than the other', ok: false, power: 'phantom', feedback: 'Unequal snare distances put the snare at two times in the pair: measure to the snare’s centre first.' },
      { id: 'e', label: 'One mic lowered into the gap between the crashes and the drummer’s head', ok: false, power: 'phantom', feedback: 'That gap is the sticks’ and the player’s space: clearance comes first.' },
    ],
    reasons: [DOC, CLEAR, { id: 'r.mono', label: 'It is checked in mono, with the close mics, not only in stereo', role: 'required', feedback: 'The mix may be heard in mono: say how you will check it.' }, { id: 'r.room', label: 'The room adds something useful to the kit in this session', role: 'optional', feedback: 'A fair studio reason.' }, BRAND, WIDE],
    explain: 'More than one method passes this brief. What passes is the reasoning: a starting point measured to the snare, clearance, and a mono check with the close mics.',
  },
  {
    id: 'oh.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A loud stage, a mono PA, little gain before feedback. The audience already hears the cymbals from the kit. One spare channel.',
    setups: [
      { id: 'a', label: 'One directional overhead over the kit, fairly close, aimed for the cymbals', ok: true, power: 'phantom', feedback: 'One channel for a mono PA, close and directional for gain before feedback.' },
      { id: 'b', label: 'No overhead in the PA — close mics on the drums, the cymbals left acoustic', ok: true, power: 'none', feedback: 'A fair choice when the audience already hears the cymbals; the spare channel could feed a recording instead.' },
      { id: 'c', label: 'A wide spaced pair, panned hard left and right', ok: false, power: 'phantom', feedback: 'Two channels for a mono PA: there is one spare, and the pan is summed away.' },
      { id: 'd', label: 'The floor-tom method, its side mic low beside the floor tom', ok: false, power: 'phantom', feedback: 'Two channels again, and a low side mic is one more open mic on a loud stage.' },
      { id: 'e', label: 'One omni high over the kit, to catch the whole stage', ok: false, power: 'phantom', feedback: 'An omni high up hears the monitors and the PA too, and costs gain before feedback.' },
    ],
    reasons: [CLEAR, { id: 'r.pa', label: 'It suits a mono PA and the one channel there is', role: 'required', feedback: 'Say how it fits the outputs: a mono PA, one spare channel.' }, { id: 'r.gbf', label: 'It leaves gain before feedback for the channels that need it', role: 'required', feedback: 'On a loud stage, say what it does for gain before feedback.' }, { id: 'r.rec', label: 'A recording or broadcast feed may still want a cymbal channel', role: 'optional', feedback: 'A fair reason for a separate feed.' }, BRAND, { id: 'r.must', label: 'A drum kit at a show needs overheads in the PA', role: 'wrong', feedback: 'Not when the audience already hears the cymbals: start from what the PA needs to add.' }],
    explain: 'Two choices pass, one of them with no overhead at all. What passes is the reasoning: the outputs, gain before feedback and clearance.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you step through: the stick strikes the top of the cymbal. Which way does the cymbal send its sound?', options: ['Only upward, toward the ceiling', 'Up and down, from both faces', 'Only out from the edge'], after: 'Now STEP through the stroke (or PLAY ONCE) and watch where the sound leaves.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'In front, close up'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you raise the mic over the snare from 1 m to 1.2 m. What changes?', options: ['More cymbals and room', 'More kick and snare', 'It depends on this kit and room'], after: 'Rest a mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'The drum fill sits behind and below the side mic. How can its pattern help?', options: ['Turn or tilt the mic so a null faces it', 'It cannot: the fill is behind it', 'Only a louder mic helps'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'Both mics are the same distance from the snare. Are they the same distance from the kick?', options: ['Yes, the same', 'No, different', 'Only if both are condensers'], after: 'Now switch SOURCE to the kick and read the delay.' },
};

/* The QUICK CHECK: 6 items, two per foundation page; q.6 (hearing) is critical. */
const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'What are overheads, in this lesson?',
    options: ['Mics above or beside the kit that hear it as a whole', 'Mics fixed inside the cymbals’ stands, one per cymbal', 'The two loudest drums on the kit'],
    correct: 'Mics above or beside the kit that hear it as a whole',
    explain: 'Overheads are a point of view on the whole kit — the main picture, or mostly the cymbals.',
    why: {
      'Mics fixed inside the cymbals’ stands, one per cymbal': 'That would be a spot mic per cymbal. Overheads hear the kit as a whole from above or beside it.',
      'The two loudest drums on the kit': 'Overheads are microphones, not drums: a point of view on the whole kit.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'On this right-handed kit, which cymbal hangs over the floor tom?',
    options: ['The ride', 'The hi-hats', 'The smaller crash'],
    correct: 'The ride',
    explain: 'The ride hangs over the floor tom on the player’s right; the hi-hats are on the left, with the smaller crash above them.',
    why: {
      'The hi-hats': 'The hi-hats stand on the player’s left, by the snare.',
      'The smaller crash': 'The smaller crash hangs on the left, above the hi-hat side.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'Which faces of a cymbal send its sound out?',
    options: ['Both, top and underside', 'Only the top face', 'Only the edge'],
    correct: 'Both, top and underside',
    explain: 'The whole plate rings and pushes air from both faces — up toward the overheads and down toward the drums.',
    why: {
      'Only the top face': 'The underside moves the air too; the close mics below a cymbal hear it.',
      'Only the edge': 'The edge moves most in many shapes, but the whole plate radiates.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'A mic is 0.5 m farther from the kick than from the snare. Struck together, when does the kick arrive?',
    options: ['About 1.5 ms after the snare', 'Before the snare: low sound is faster', 'At the same moment as the snare'],
    correct: 'About 1.5 ms after the snare',
    explain: 'Sound travels about 34 cm per millisecond at 20 °C, whatever the pitch: half a metre is about 1.5 ms.',
    why: {
      'Before the snare: low sound is faster': 'All pitches travel at the same speed in air.',
      'At the same moment as the snare': 'Different distances mean different arrival times.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    prompt: 'Where does an overhead’s boom stand stand?',
    options: ['Outside the kit, its boom clear of the player', 'Inside the kit, as close to the mic as it fits', 'Behind the throne, its boom over the player'],
    correct: 'Outside the kit, its boom clear of the player',
    explain: 'The base stands outside the kit; the boom reaches in, counterweighted, out of the sticks’ reach — nothing balanced over the player.',
    why: {
      'Inside the kit, as close to the mic as it fits': 'Inside the kit, a stand is in the player’s and the drums’ way.',
      'Behind the throne, its boom over the player': 'Over the player is exactly where a boom should not hang.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your overheads are rated to 140 dB SPL. What does that tell you about sitting by the kit through a long soundcheck?',
    options: ['Nothing — it is the mic’s distortion limit, not a hearing limit', 'It is safe while the kit stays below the mics’ 140 dB', 'It is safe as long as the mics are above the kit'],
    correct: 'Nothing — it is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe while the kit stays below the mics’ 140 dB': 'A mic’s rating is about the mic. Hearing risk depends on the level where you are and for how long.',
      'It is safe as long as the mics are above the kit': 'Where the mics are says nothing about your ears. Measure where you listen, and limit the time.',
    },
  },
];

export const M09_LESSON: Lesson = {
  id: 'M09',
  labId: 'drums',
  title: 'Drum Overheads',
  subtitle: 'One mic or a pair above the kit — the floor-tom method, X/Y, ORTF and a spaced pair',
  noun: { one: 'kit overhead', many: 'kit overheads' },
  model: M09_MODEL,
  micTypeIds: ['ohPencil', 'ohLdc'],
  zones: M09_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT THEY ARE', text: 'Overheads are microphones above — or just beside — the drum kit that hear the whole kit at once. They are a point of view on the drums and cymbals, not an instrument of their own.', src: 'S-OH-MM' },
    { title: 'WHERE YOU MEET THEM', text: 'In most studio drum recordings, and on many stages — wherever the cymbals, or the whole kit, need to reach the mix.', src: 'DPA-KIT' },
    { title: 'THEIR JOB', text: 'Either the main picture of the kit — drums and cymbals in balance, close mics adding focus — or mostly the cymbals, supporting close mics on the drums. Decide which before you place them.', src: 'S-OH-MM' },
    { title: 'THE KIT THEY HEAR', text: 'A typical 5-piece: a 22 in kick, a 14 in snare, 10 and 12 in rack toms, a 16 in floor tom, 14 in hi-hats, 16 and 18 in crashes and a 20 in ride. In this drawing the cymbals hang about 0.85–1.2 m off the floor and a seated drummer’s head is near 1.3 m.', src: 'ZIL-K' },
  ],
  sound: {
    // The drum lessons' strike sequence is not used here (the lesson draws its
    // own HOW IT SOUNDS page); these are its cymbal words for completeness.
    stages: [
      { title: 'The stick meets the bow', text: 'The stick strikes the cymbal on its bow for a moment, then leaves.' },
      { title: 'The plate bends', text: 'The plate bends under the stick; the felts hold its centre.' },
      { title: 'It rings and rocks', text: 'The whole plate rings, the edge moving most, and rocks on its felts.' },
      { title: 'Sound leaves both faces', text: 'Up toward the overheads and down toward the drums.' },
    ],
    attack: 'The attack is the stick’s brief contact with the cymbal — or with a drum’s head — a short, bright start.',
    body: 'The body is the ringing that follows: long for a cymbal, its whole plate sending sound from both faces; shorter for a drum, mostly from its heads.',
    head: { diameterMm: 16 * 25.4, rods: 0, label: '16 in crash', strikeSrc: 'ZIL-K', hoop: 'metal' },
  },
  setting: {
    items: [
      { id: 'cymbals', label: 'the crash cymbals', short: 'CRASHES', planIds: ['crash1', 'crash2'], tag: 'CLOSEST', note: 'They hang highest and closest to an overhead, and swing when struck. Keep each mic and its boom outside the swing — about 6 cm each way at the edge is the keep-out drawn here.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan positions; swing envelope a drawing default' } },
      { id: 'ride', label: 'the ride', short: 'RIDE', tag: 'PLAYED ON', note: 'Over the floor tom, played all the time on its bow and bell. An overhead on that side — and the floor-tom side mic — hears it strongly.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan position' } },
      { id: 'hihat', label: 'the hi-hats', short: 'HI-HATS', tag: 'LOUD, CLOSE', note: 'To the player’s left: often one of the loudest things in an overhead on that side. Air puffs out sideways as the pair closes.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan position' } },
      { id: 'snare', label: 'the snare', short: 'SNARE', tag: 'REFERENCE', note: 'The overheads’ usual reference: their distances are measured to its centre, so its sound reaches each mic at the same moment.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan position' } },
      { id: 'kick', label: 'the kick', short: 'KICK', tag: 'FARTHEST', note: 'Low and in the middle: an overhead hears it last and weakest. The line from the kick through the snare is a useful centre line for a pair.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan position' } },
      { id: 'toms', label: 'the rack toms', short: 'TOMS', planIds: ['tom1', 'tom2'], tag: 'UNDER CRASHES', note: 'Under the crashes. Moving a pair toward the front of the kit brings the rack toms and the cymbals closer.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan positions' } },
      { id: 'floor', label: 'the floor tom', short: 'FLOOR TOM', tag: 'SIDE MIC', note: 'The floor-tom method’s side mic sits just beyond it, about a hand’s width above its rim, outside the player’s reach.', scene: 'all', prov: { kind: 'illustrative', reason: 'kit plan position' } },
      { id: 'throne', label: 'the player’s space', short: 'PLAYER', tag: 'KEEP OUT', note: 'The drummer’s head, shoulders and sticks. Nothing hangs over the player without a sturdy, counterweighted stand, and nothing goes in the sticks’ reach.', scene: 'all', prov: { kind: 'illustrative', reason: 'drawing defaults for the drummer’s envelope' } },
      { id: 'fill', label: 'the drummer’s fill monitor', short: 'DRUM FILL', tag: 'BELOW THE MICS', note: 'Beside the throne, aimed at the drummer. Overheads point down at the kit, so the stage below them — this monitor included — is part of what they hear.', scene: 'stage', prov: { kind: 'illustrative', reason: 'M01’s stage position' } },
      { id: 'downstage', label: 'another player’s wedge', short: 'DOWNSTAGE', tag: 'SPILL', note: 'Downstage of the kit, aimed upstage at another player — loud, and in front of a mic beside the kit.', scene: 'stage', prov: { kind: 'illustrative', reason: 'M01’s stage position' } },
      { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE', tag: 'ALREADY HEARS', note: 'The audience already hears the cymbals from the kit. Start from what the PA needs to add — that may be little, or a feed for a recording.', scene: 'stage', prov: { kind: 'illustrative', reason: 'a typical stage' } },
      { id: 'room', label: 'the studio room', short: 'ROOM', tag: 'PART OF THE SOUND', note: 'Overheads hear the room as well as the kit: higher and wider tends to bring in more of it. A good room can help; a poor one argues for closer mics.', scene: 'studio', prov: { kind: 'illustrative', reason: 'a typical room' } },
    ],
    stage: 'A stage adds monitors on the floor and a PA facing the audience. Overheads point down at the kit — and the stage is below them too.',
    studio: 'A studio has no monitors on the floor; the room is part of what overheads hear.',
  },
  diagnostic,
  practice: {
    task: 'Choose overheads for each brief. As the lesson says, more than one placement can pass when its reasoning and safety checks are sound.',
    fields: [
      { id: 'kit', label: 'Kit, room and performance', kind: 'text' },
      { id: 'role', label: 'Role of the overheads', kind: 'choice', choices: ['Main kit picture', 'Mostly cymbals', 'In between'] },
      { id: 'method', label: 'Method', kind: 'choice', choices: ['One overhead', 'X/Y', 'ORTF', 'Spaced pair', 'Floor-tom method', 'Other'] },
      { id: 'dist', label: 'Distances to the snare’s centre (each mic)', kind: 'text' },
      { id: 'mono', label: 'Mono check with the close mics', kind: 'text' },
      { id: 'clear', label: 'Clearance and mounting checked', kind: 'text' },
      { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Kit positions, heights and tilts — a typical right-handed layout, drawing defaults.', dims: [] },
    { text: 'The drummer’s body and the sticks’ reach (head top 1.3 m, shoulder 1.15 m, reach 700 mm) — drawing defaults, not published figures.', dims: [] },
    { text: 'The X/Y and ORTF pair height over the snare (the mono height), the spaced pair’s plan points, and the shoulder method’s kick reference point (the kick’s batter centre) — drawing defaults.', dims: [] },
    { text: 'The overhead boom stand’s reach and tube sizes — ILLUSTRATIVE.', dims: [] },
    { text: 'Every keep-out clearance, including each cymbal’s swing (± 60 mm at the edge) — ILLUSTRATIVE values for the owner to approve.', dims: ['cym.hihat', 'cym.crash1', 'cym.crash2', 'cym.ride'] },
    { text: 'The floor line (M01’s floor).', dims: ['yFloor'] },
    { text: `The cymbal family’s drawing defaults: ${CYMBAL_DRAWING_DEFAULTS.join('; ')}.`, dims: [] },
    { text: `The drum family’s drawing defaults: ${DRUM_DRAWING_DEFAULTS.join('; ')}.`, dims: [] },
    { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
  ],
  live: { wedges: M09_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every kit, player and room is different: move the mics, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a typical 5-piece kit in a right-handed layout (its positions and heights are drawing values), mic patterns and the two-mic comb as textbook shapes, cymbal motion drawn larger. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the drummer stopped.',
  copy: M09_COPY,
};
