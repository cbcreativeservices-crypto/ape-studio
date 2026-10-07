/**
 * E06 CHILDREN'S VOICES AND CHOIRS — the lesson as DATA, on the ensemble
 * pages, DRAWN FROM ABOVE ONLY (`ensemble.views: ['plan']`; the lead ruling).
 * Words from the owner's lesson (docs/labs/miking/source_text/
 * Childrens-Voices-and-Choirs-Miking-Technique.txt; "L<n>" in comments
 * only); research in docs/labs/miking/childrens_choir/ and choir/;
 * corrections E6-* in CORRECTIONS_LOG.md:
 *   • SAFEGUARDING (L6, L25): supervision at all times; a responsible adult
 *     sets up and changes every mic; headsets fitted only by authorised
 *     adults, comfort and agreement first; the venue's child-safeguarding
 *     policy and local law — said WITHOUT naming an authority (the ruling);
 *   • EXPOSURE (L7, L106): measure at the children's positions (A-weighted
 *     15-minute average and C-weighted peak); the widely used limits for
 *     events aimed at children (94 dB LAeq,15min, 120 dB LCpeak) said as
 *     numbers, the source kept internal; lower the level at the source first;
 *   • the occupational names of L7 (and the missing reference) are not carried;
 *   • "never hang a mic over children's heads" (L38) kept, with the church
 *     article's "in front of the mouths";
 *   • the school words → "you", "Practice exercise", "a responsible adult".
 * Suggested starting points; no sources on screen; FULLY SILENT.
 */
import type { DiagnosticItem, LessonPages, MikingScenario, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import type { EnsembleLesson } from '../shared/ensemble/ensembleData.ts';
import { ensembleWords, msMono, ortfFixed, PAIR_REASON, POWER_REASON } from '../shared/ensemble/ensembleItems.ts';
import { feedbackSymptom, fewerMics, GROUP_BRAND, hangDiag, NO_PROVOKE_REASON, noProvoke, overHeads, ownMonitor, phaseySymptom, SAFE_REASON, threeToOne, threeToOneWhy } from '../shared/ensemble/voiceGroupItems.ts';
import { E06_31, E06_MODEL, E06_PLACE, E06_SETUPS, E06_WEDGES, E06_ZONES, PAIR_FAR } from './geometry.ts';

/** The exposure line (research childrens_choir/SOURCES.md §b, proposed L7/L106 wording, no names). */
export const EXPOSURE = 'Lower the level at the source first. Measure at the children’s own positions with a sound level meter — an A-weighted 15-minute average and a C-weighted peak. A widely used standard for events aimed at children sets about 94 dB averaged over 15 minutes and 120 dB peak as limits: keep well below them. Keep soundchecks short and quiet; a child’s discomfort, ringing ears or not hearing instructions is never a normal part of a soundcheck.';
/** The safeguarding line (childrens_choir/SOURCES.md §a, no names). */
export const SAFEGUARDING = 'Children are supervised at all times. A responsible adult or qualified crew member controls the setup, the access and every change to a mic; a headset or a transmitter is fitted only by an authorised adult, with the child’s agreement and comfort first, and with a quick way to mute or remove it. Follow the venue’s child-safeguarding policy and the local law.';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet a children’s choir from above — its two rows, its sections, a featured singer — and where its sound leaves: every young mouth, forward, lower and often quieter than an adult’s. Shown, never played.',
    credit: { scenarios: ['cc.meet.1', 'cc.meet.2', 'cc.meet.3'], note: 'Answer the three checks on where the sound leaves.' },
    takeaway: 'Children’s voices leave their mouths lower than adults’ and are often quieter, and they change level quickly. A mic set for adults’ heights hears the tops of their heads — aim at their mouths.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real setups drawn from above — one X/Y pair first, a 17 cm pair farther back, two area mics 3:1 apart, a stand mic an adult sets for a featured child. Then safeguarding, hearing and what to settle before any mic goes up.',
    credit: { scenarios: ['cc.set.1', 'cc.hang', 'cc.hear'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Safety and safeguarding come first: supervised children, stable stands, protected cables, nothing over their heads, quiet monitors. Then one main pair before any close mic; area mics a few feet out, aimed at the mouths, 3:1 apart.',
  },
  microphone: {
    title: 'Choose the microphones',
    goal: 'Choose by what the children and the production need — a pair or area condensers for the choir, a stand mic before a handheld for a young soloist, a headset only with supervision — and keep each method’s geometry.',
    credit: { scenarios: ['cc.mic.1', 'cc.ortf', 'cc.ms', 'cc.mic.2', 'cc.rec.1'], note: 'Answer the five checks (one reaches back to where the sound leaves).' },
    takeaway: 'Directional condensers on stable stands for the choir; a stand mic an adult sets for a soloist — a handheld only when the child can hold and aim it safely; a headset only fitted and checked by authorised adults.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from the pair and move it yourself — nearer, farther, higher — and see what changes for the front and back rows. From above: the height is in the readout and the words.',
    credit: { scenarios: ['cc.place.1', 'cc.place.2', 'cc.31', 'cc.rec.2'], interactive: 'twoZones', note: 'Rest the pair’s centre, clear of the children, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'Begin with one pair and move it in small steps. Nearer favours the front row and the words; farther, the blend. Aim at the mouths, not the tops of heads: children stand lower than adults.',
  },
  context: {
    title: 'Live and recording',
    goal: 'Turn an area mic so a low floor monitor sits in its rejection — and know why a children’s choir needs the fewest open mics, quiet monitors and no choir mics in their own monitor.',
    credit: { scenarios: ['cc.ctx.1', 'cc.mon', 'cc.ctx.studio', 'cc.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: turn the area mic (or change its pattern) until the monitor sits in its rejection. STUDIO: answer the decision card. Then the checks.' },
    takeaway: 'Live, a children’s choir is a feedback and a supervision problem: the fewest open mics, quiet monitors in the mics’ nulls, never the choir mics in the choir monitor. A small room may need little or no reinforcement.',
  },
  twoMic: {
    title: 'A pair and a soloist’s mic',
    goal: 'The choir’s pair and the soloist’s stand mic: see how much earlier the close mic hears the child, what polarity changes and what it does not.',
    credit: { scenarios: ['cc.first', 'cc.two.1', 'cc.two.2'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND move a mic so the delay changes, then answer the three checks.' },
    takeaway: 'The close mic hears the soloist long before the pair: summed, the late copy can comb. Balance the soloist with the close mic’s level, keep the pair as the choir’s reference, and judge in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to its likely cause and the first change to try.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all seven symptoms (a retry is explained, never penalised).' },
    takeaway: 'Stop the group for anything unsafe; then layout and placement first — the mic’s height and aim at the mouths, the spacing, the spots’ level, the monitors — before EQ. Lower the level at the first sign of ringing or discomfort.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a children’s-choir setup in order, choose and justify a setup for a recording and for a school concert with a PA, and say what keeps the children safe and heard.',
    credit: { scenarios: ['cc.prac.order', 'cc.prac.gain', 'cc.prac.setup1', 'cc.prac.setup2', 'cc.prac.3', 'cc.nom', 'cc.31why', 'cc.ring'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional.' },
    takeaway: 'Supervision and a safe stage first; one pair before any close mic; area mics aimed at the mouths, 3:1 apart; gain on the loudest passage; quiet monitors brought up only to the agreed level; sound measured where the children are.',
  },
};

/* THE CHECKS. Lesson refs (comments only): meet L4, L10–L14 · set L5–L8 · mic L19–L25 · place L13–L18 · ctx L35–L38 · two L30–L31 · prac L26–L34, L101–L107. */
const scenarios: MikingScenario[] = [
  {
    id: 'cc.meet.1',
    page: 'meet',
    prompt: 'Compared with an adult choir, where does a children’s choir’s sound leave?',
    options: ['From mouths lower down, forward', 'From the same height as adults’ mouths', 'From the riser under the back row'],
    correct: 'From mouths lower down, forward',
    explain: 'The voices leave the children’s mouths, forward — lower than adults’. A mic set for adult heights aims over their heads and hears them duller and more distant.',
    why: {
      'From the same height as adults’ mouths': 'Children stand lower: a mic set for adults sits too high for them.',
      'From the riser under the back row': 'A riser adds thumps; the voices leave from the mouths.',
    },
  },
  {
    id: 'cc.meet.2',
    page: 'meet',
    prompt: 'A mic is set at an adult choir’s height in front of the children. What tends to happen?',
    options: ['It sounds dull and distant', 'It hears the back row best of all', 'It hears only the conductor’s voice'],
    correct: 'It sounds dull and distant',
    explain: 'Too high, the mic aims at the tops of the children’s heads: dull and distant. Too low, it hears the riser and the front row. Aim at the mouths.',
    why: {
      'It hears the back row best of all': 'Too high, it aims past everyone’s mouths — the back row included.',
      'It hears only the conductor’s voice': 'The conductor is behind it and quiet; the problem is the angle to the children.',
    },
  },
  {
    id: 'cc.meet.3',
    page: 'meet',
    prompt: 'Why plan for young voices that change level quickly?',
    options: ['A steady mic distance is harder to keep', 'Children’s voices are usually very loud', 'Young voices leave from the chest'],
    correct: 'A steady mic distance is harder to keep',
    explain: 'Young singers vary widely in loudness, confidence and how still they stand: a repeatable distance, a stable stand and conservative gain help more than any one setting.',
    why: {
      'Children’s voices are usually very loud': 'Many are quiet, some loud — they vary, which is the point.',
      'Young voices leave from the chest': 'The voice leaves from the mouth, at any age.',
    },
  },
  {
    id: 'cc.set.1',
    page: 'setups',
    prompt: 'Who places and adjusts the mics at a children’s concert?',
    options: ['A responsible adult or qualified crew', 'The children, once shown how it works', 'Whoever is nearest when it is needed'],
    correct: 'A responsible adult or qualified crew',
    explain: 'A responsible adult or qualified crew member controls the setup, the access, wireless and every change to a mic — the children are supervised at all times.',
    why: {
      'The children, once shown how it works': 'Children are never left to move stands, booms or cables.',
      'Whoever is nearest when it is needed': 'Setup and changes are controlled, by a named responsible adult or crew.',
    },
  },
  overHeads('cc', 'setups', 'the children'),
  {
    id: 'cc.hear',
    page: 'setups',
    prompt: 'How do you protect the children’s hearing at the soundcheck?',
    options: ['Lower it at the source; measure where they are', 'Hand out earplugs to the children and keep the level up', 'Check the level at the mixing desk only'],
    correct: 'Lower it at the source; measure where they are',
    explain: EXPOSURE,
    why: {
      'Hand out earplugs to the children and keep the level up': 'Reduce the sound at the source first; protectors are a fitted extra, not a licence for level.',
      'Check the level at the mixing desk only': 'The desk is not where the children stand: measure at their positions.',
    },
  },
  {
    id: 'cc.mic.1',
    page: 'microphone',
    prompt: 'A young soloist needs her own mic. What is a fair first choice?',
    options: ['A stand mic an adult sets at her height', 'A handheld she must hold and aim herself', 'A headset she fits on her own backstage'],
    correct: 'A stand mic an adult sets at her height',
    explain: 'For a young performer a stable stand an adult sets is often safer and more consistent than a handheld. A handheld only when the child can hold and aim it safely; a headset only fitted by an authorised adult.',
    why: {
      'A handheld she must hold and aim herself': 'Fine only when she can do it safely — no covered grille, no cable swinging, not aimed at a monitor.',
      'A headset she fits on her own backstage': 'A headset is fitted and checked by an authorised adult, never by the child alone.',
    },
  },
  ortfFixed('cc', 'microphone'),
  msMono('cc', 'microphone'),
  {
    id: 'cc.mic.2',
    page: 'microphone',
    prompt: 'A headset keeps a moving child’s distance steady. What does it NOT do?',
    options: ['Remove feedback and breath noise', 'Hold one distance as she turns', 'Keep up with her as she moves'],
    correct: 'Remove feedback and breath noise',
    explain: 'A headset can steady the mouth-to-mic distance and help the words — but it still needs a monitor plan, and it can pick up clothing and breath noise. Fitted and checked by authorised adults.',
    why: {
      'Hold one distance as she turns': 'That it does: the capsule moves with her head.',
      'Keep up with her as she moves': 'That it does too — the reason to choose one.',
    },
  },
  {
    id: 'cc.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Why does a mic set for adults sound dull on a children’s choir?',
    options: ['It aims above the children’s mouths', 'Children’s voices have no high end', 'It is too far from the conductor'],
    correct: 'It aims above the children’s mouths',
    explain: 'Children’s mouths are lower: a mic at an adult height aims at the tops of their heads. Lower it until it aims at the mouths and the back row.',
    why: {
      'Children’s voices have no high end': 'They do — the mic’s angle misses it.',
      'It is too far from the conductor': 'The conductor is not the source; the children’s mouths are.',
    },
  },
  {
    id: 'cc.place.1',
    page: 'placement',
    prompt: 'The front row dominates the pair. First change?',
    options: ['Raise it or angle it toward the middle', 'Add a spot for each child at the back', 'Ask the front row to sing more quietly'],
    correct: 'Raise it or angle it toward the middle',
    explain: 'Too low or too close, the pair favours the front row. Raise or angle it toward the acoustic centre, or move it back — and recheck the words.',
    why: {
      'Add a spot for each child at the back': 'Close mics first hide a placement problem — and add stands near children.',
      'Ask the front row to sing more quietly': 'Their singing is the performance; move the pair.',
    },
  },
  {
    id: 'cc.place.2',
    page: 'placement',
    prompt: 'The back row is dull and weak. What do you check?',
    options: ['The aim at the mouths and the height', 'The colour of the back row’s clothes', 'The phantom power on the front mics'],
    correct: 'The aim at the mouths and the height',
    explain: 'Too high, too close to the front, or aimed at heads: the back row loses its words. Aim at the mouths and the back row; adjust the height and the children’s spacing.',
    why: {
      'The colour of the back row’s clothes': 'Clothing does not change how the voices reach the mic.',
      'The phantom power on the front mics': 'Then nothing would be heard; the balance is a matter of aim and height.',
    },
  },
  threeToOne('cc', 'placement', 'about 60 cm (2 ft)', '1.8 m (6 ft)'),
  {
    id: 'cc.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Who adjusts a stand once the children are in place?',
    options: ['A responsible adult, the group stopped', 'A child at the front, while singing', 'Anyone, as long as it is quick'],
    correct: 'A responsible adult, the group stopped',
    explain: 'Stop the group before moving a stand, a boom, a cable or a hanging mic; a responsible adult or crew member makes the change.',
    why: {
      'A child at the front, while singing': 'Children never move equipment, and nothing moves while they sing.',
      'Anyone, as long as it is quick': 'Quick is not safe: stop the group, and a responsible adult does it.',
    },
  },
  {
    id: 'cc.ctx.1',
    page: 'context',
    prompt: 'A school concert with a PA and a band. A good start for the choir mics?',
    options: ['The fewest open mics that cover them', 'A close mic on each of the children on stage', 'Spaced omnis sent to the PA'],
    correct: 'The fewest open mics that cover them',
    explain: 'Live, it is a gain-before-feedback and supervision problem: the fewest open choir mics, in front, a little above the mouths, aimed at the group.',
    why: {
      'A close mic on each of the children on stage': 'Many open mics eat the margin and put stands and cables among children.',
      'Spaced omnis sent to the PA': 'Omnis hear the PA as much as the children — rarely a live start.',
    },
  },
  ownMonitor('cc', 'context', 'choir'),
  {
    id: 'cc.ctx.studio',
    page: 'context',
    prompt: 'STUDIO · A children’s choir in a quiet room, no PA. Where do you start?',
    options: ['One pair, then several short takes', 'A close mic on each child first', 'Spots first, then a pair to finish'],
    correct: 'One pair, then several short takes',
    explain: 'Record a rehearsal pass with one stereo pair or area mic — not a close mic on every child. Several short takes beat one long, loud session.',
    why: {
      'A close mic on each child first': 'Close mics expose breath and distance changes, and crowd the room with stands.',
      'Spots first, then a pair to finish': 'The pair is the natural reference; spots only support it.',
    },
  },
  {
    id: 'cc.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where is the children’s sound level checked?',
    options: ['At the children’s own positions', 'At the mixing desk, by the meters', 'At the back of the audience'],
    correct: 'At the children’s own positions',
    explain: 'Exposure is measured where the children stand — an A-weighted 15-minute average and a C-weighted peak — and lowered at the source first.',
    why: {
      'At the mixing desk, by the meters': 'Desk meters show signal level, not what reaches the children’s ears.',
      'At the back of the audience': 'The audience is not where the children are exposed.',
    },
  },
  {
    id: 'cc.first',
    page: 'twoMic',
    prompt: 'The soloist’s mic is about 1.5 m closer to her than the pair. What happens?',
    options: ['It hears her about 4 ms earlier', 'Both mics hear her at the same time', 'The pair hears her before her mic'],
    correct: 'It hears her about 4 ms earlier',
    explain: 'Sound travels about 1 m in 2.9 ms, so 1.5 m is about 4 ms. Summed, the pair’s late copy of her voice can comb — keep the pair for the choir and balance her with her own mic.',
    why: {
      'Both mics hear her at the same time': 'They are at different distances, so the arrivals differ.',
      'The pair hears her before her mic': 'Her mic is closer, so it hears her first.',
    },
  },
  {
    id: 'cc.two.1',
    page: 'twoMic',
    prompt: 'The soloist sounds thin with both mics up. First change?',
    options: ['Balance the levels, then check mono', 'Flip the polarity until it sounds full', 'Add a delay set from the distance'],
    correct: 'Balance the levels, then check mono',
    explain: 'Listen to each mic alone, then together and in mono. Level and placement first; polarity tests one relationship, and a delay is a trial judged by ear.',
    why: {
      'Flip the polarity until it sounds full': 'A flip changes the sign, not the time difference behind the thinness.',
      'Add a delay set from the distance': 'Distance alone sets no universal delay; level and placement come first.',
    },
  },
  {
    id: 'cc.two.2',
    page: 'twoMic',
    prompt: 'What sets the delay between the pair and the soloist’s mic?',
    options: ['The path difference from her mouth', 'The distance between the two stands', 'The polarity switch on her mic'],
    correct: 'The path difference from her mouth',
    explain: 'The relevant distance is the difference in paths from her mouth to each mic, not the gap between the mics: 1 m of path difference is about 2.9 ms.',
    why: {
      'The distance between the two stands': 'Two stands can be far apart yet equally distant from her.',
      'The polarity switch on her mic': 'Polarity flips the sign; it does not move the arrival.',
    },
  },
  {
    id: 'cc.prac.gain',
    page: 'practice',
    prompt: 'How do you set gain for a children’s choir?',
    options: ['On the loudest full-group passage', 'On the quietest child’s solo line', 'On the conductor’s spoken count-in'],
    correct: 'On the loudest full-group passage',
    explain: 'Set gain on the loudest full-group passage with conservative headroom — and keep preamps, headphones and monitors at levels that let the children hear instructions comfortably.',
    why: {
      'On the quietest child’s solo line': 'The first full chorus would then overload.',
      'On the conductor’s spoken count-in': 'A spoken count says nothing about the choir’s peaks.',
    },
  },
  {
    id: 'cc.prac.3',
    page: 'practice',
    prompt: 'What earns a featured child a mic of her own?',
    options: ['A solo the pair cannot carry', 'One for each child, to be fair', 'A spare stand in the room'],
    correct: 'A solo the pair cannot carry',
    explain: 'Individual mics only when the production truly needs independent control — a soloist, broadcast speech, a separate part. Each adds a stand, a cable, crosstalk and supervision.',
    why: {
      'One for each child, to be fair': 'Fairness is not a miking reason: many close mics add stands, cables and feedback risk.',
      'A spare stand in the room': 'A spare stand is a trip hazard, not a reason.',
    },
  },
  fewerMics('cc', 'practice'),
  threeToOneWhy('cc', 'practice'),
  noProvoke('cc', 'practice'),
];

const symptoms: Symptom[] = [
  {
    id: 'cc.s.front',
    observation: 'The front row dominates',
    firstChecks: 'Is the array aimed too low or too close to the front row? Raise or angle it toward the acoustic centre and recheck the words.',
    options: ['Raise or angle it to the centre', 'Cut the front row with EQ on the bus', 'Spot the back row up loud'],
    correct: 'Raise or angle it to the centre',
    explain: 'Too low or close, the front row is much nearer. Raise or angle the array toward the middle of the choir, then check the words.',
    why: { 'Cut the front row with EQ on the bus': 'EQ cannot separate one row from another.', 'Spot the back row up loud': 'Spots first add overlap and stands near children.' },
  },
  {
    id: 'cc.s.back',
    observation: 'The back row is dull or weak',
    firstChecks: 'Too high, too close to the front, or aimed at heads? Aim at the mouths and the back row; adjust height and spacing.',
    options: ['Aim at the mouths; adjust the height', 'Boost the treble on the whole choir', 'Ask the back row to shout'],
    correct: 'Aim at the mouths; adjust the height',
    explain: 'Children stand lower than adults: aim at their mouths and the back row, set the height, and let the director adjust the spacing.',
    why: { 'Boost the treble on the whole choir': 'Treble raises the noise and the front row too.', 'Ask the back row to shout': 'Never ask children to push their voices: fix the mic.' },
  },
  phaseySymptom('cc.s.hollow', 'The choir sounds hollow in mono'),
  feedbackSymptom('cc.s.ring'),
  {
    id: 'cc.s.instr',
    observation: 'A child cannot hear the instructions',
    firstChecks: 'Monitor or PA too loud, or a poor stage position? Reduce the level, move the child from loud sources, check the exposure.',
    options: ['Lower the level; check their exposure', 'Turn the talkback up over the band', 'Give the child a louder monitor'],
    correct: 'Lower the level; check their exposure',
    explain: 'A child who cannot hear instructions is a sign of too much level. Lower it, move the child away from loud sources, and measure at their position.',
    why: { 'Turn the talkback up over the band': 'Louder on top of loud raises their exposure.', 'Give the child a louder monitor': 'More monitor level is the problem, not the fix.' },
  },
  {
    id: 'cc.s.cable',
    observation: 'A cable or a stand becomes a hazard',
    firstChecks: 'Did the layout change after soundcheck, or is equipment unsecured? Stop the group, secure the route, recheck the exit path.',
    options: ['Stop the group and secure it', 'Tape it down during the song', 'Ask the children to step around it'],
    correct: 'Stop the group and secure it',
    explain: 'Stop, secure the stand or cable — a sandbag, a ramp at a crossing — and recheck the way out before going on.',
    why: { 'Tape it down during the song': 'Nothing is moved or fixed while the children sing: stop first.', 'Ask the children to step around it': 'The hazard is removed, not worked around.' },
  },
  {
    id: 'cc.s.headset',
    observation: 'A headset is noisy or uncomfortable',
    firstChecks: 'Poor fit, clothing contact, or the cable or pack badly placed? Stop and refit under an adult’s supervision.',
    options: ['Stop and refit it, with an adult', 'Turn the headset’s channel down', 'Tell the child to hold still'],
    correct: 'Stop and refit it, with an adult',
    explain: 'Discomfort is never normal: stop, and an authorised adult refits the headset, the cable and the pack clear of the neck and the costume.',
    why: { 'Turn the headset’s channel down': 'That hides the noise and leaves the child uncomfortable.', 'Tell the child to hold still': 'Comfort and safety come first; refit it.' },
  },
];

const SAFEGUARD_REASON: SetupReason = { id: 'r.adult', label: 'A responsible adult sets up and changes every mic', role: 'required', feedback: 'Say who controls the setup: children are supervised, and adults handle the equipment.' };
const LEVEL_REASON: SetupReason = { id: 'r.level', label: 'Quiet monitors, the level measured where the children are', role: 'required', feedback: 'Say how the children’s hearing is protected: lower at the source, measure at their positions.' };
const EVERY_CHILD: SetupReason = { id: 'r.every', label: 'A close mic on each child for full control', role: 'wrong', feedback: 'Close mics on each child add stands, cables and feedback risk among children — and expose every breath.' };

const setupTasks: SetupTask[] = [
  {
    id: 'cc.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A recording of a children’s choir in two rows in a quiet hall; no PA. Phantom power on every input; supervising adults present.',
    setups: [
      { id: 'a', label: 'One X/Y pair a few feet out, a little above their heads', ok: true, power: 'phantom', feedback: 'The place to begin: their blend and the room. Move it in small steps.' },
      { id: 'b', label: 'A 17 cm pair farther back, the choir filling its angle', ok: true, power: 'phantom', feedback: 'Fair: a wider picture; check the outer children and mono.' },
      { id: 'c', label: 'A close mic on each child', ok: false, power: 'phantom', feedback: 'Stands among children, every breath exposed, no blend.' },
      { id: 'd', label: 'A pair at adult head height, aimed level', ok: false, power: 'phantom', feedback: 'Too high for children: it aims over their heads and sounds dull.' },
      { id: 'e', label: 'A mic hung straight over the back row', ok: false, power: 'phantom', feedback: 'Never over children’s heads; in front of the mouths, only on the venue’s rigging.' },
    ],
    reasons: [PAIR_REASON, SAFEGUARD_REASON, SAFE_REASON, POWER_REASON, EVERY_CHILD, GROUP_BRAND],
    explain: 'More than one setup passes. What passes is the reasoning: supervision, a safe stage, one main pair first, aimed at the children’s mouths.',
  },
  {
    id: 'cc.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A school concert: the children’s choir with a band and a PA, a floor monitor in front carrying the piano.',
    setups: [
      { id: 'a', label: 'Two area mics 3:1 apart, aimed at their mouths, monitors low', ok: true, power: 'phantom', feedback: 'The fewest mics, spaced 3:1, the monitor quiet and in their rejection.' },
      { id: 'b', label: 'One pair for the choir and a stand mic an adult sets for a soloist', ok: true, power: 'phantom', feedback: 'Fair: the soloist gets control, the pair keeps the choir.' },
      { id: 'c', label: 'Handhelds for every child in the front row', ok: false, power: 'phantom', feedback: 'Covered grilles, swinging cables and mics aimed at the monitor: too many and unsafe.' },
      { id: 'd', label: 'The choir mics sent to the children’s monitor', ok: false, power: 'phantom', feedback: 'A sure path to feedback — and more level at the children’s ears.' },
      { id: 'e', label: 'Monitors loud so the children feel the band', ok: false, power: 'phantom', feedback: 'Loud monitors raise the children’s exposure and bring feedback closer.' },
    ],
    reasons: [SAFEGUARD_REASON, LEVEL_REASON, SAFE_REASON, NO_PROVOKE_REASON, GROUP_BRAND],
    explain: 'Two setups pass. What passes is the reasoning: supervision, quiet monitors measured where the children are, the fewest mics — and no provoked feedback.',
  },
];

const predictions: EnsembleLesson['predictions'] = {
  microphone: { prompt: 'Before you look: which pattern rejects most of the PA behind it?', options: ['Cardioid', 'Omni', 'They reject the same'], after: 'Now sweep SOURCE ANGLE round the pattern and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the pair from 0.9 m to 1.7 m in front. What changes most?', options: ['More blend and more room', 'Only the level', 'The front row dominates more'], after: 'Farther back, the distances to the front and back rows even out: the NEAR / FAR readout shrinks.' },
  context: { prompt: 'A low monitor sits in front of the children, below the area mic. Can the mic’s rejection reach it?', options: ['Yes — turn the mic or tighten its pattern', 'No — only an omni can', 'It is already in the null'], after: 'Now turn the mic with AIM (or change PATTERN) and watch REJECTION.' },
  twoMic: { prompt: 'The pair and the soloist’s mic. If you flip B’s polarity, what happens to Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'cc.q.1',
    covers: 'meet',
    prompt: 'Where should a children’s choir mic aim?',
    options: ['At their mouths and the back row', 'At the tops of the children’s heads', 'Level, at an adult’s head height'],
    correct: 'At their mouths and the back row',
    explain: 'Children stand lower than adults: aim at their mouths and the back row, not at the tops of heads.',
    why: { 'At the tops of the children’s heads': 'Heads do not sing: aimed there it sounds dull and distant.', 'Level, at an adult’s head height': 'That aims over the children entirely.' },
  },
  {
    id: 'cc.q.2',
    covers: 'meet',
    prompt: 'Young voices often vary widely in level. What helps most?',
    options: ['A steady distance and conservative gain', 'A close mic on each of the children in the rows', 'Asking the quiet ones to sing louder'],
    correct: 'A steady distance and conservative gain',
    explain: 'A repeatable distance, a stable stand and gain set on the loudest passage handle the variation better than any one setting.',
    why: { 'A close mic on each of the children in the rows': 'That exposes every breath and adds stands among children.', 'Asking the quiet ones to sing louder': 'Never ask children to push their voices; fix the capture.' },
  },
  {
    id: 'cc.q.3',
    covers: 'setups',
    critical: true,
    prompt: 'Who fits a headset on a child?',
    options: ['An authorised adult, comfort first', 'The child, once shown how it goes on', 'A crew member who happens to be near'],
    correct: 'An authorised adult, comfort first',
    explain: SAFEGUARDING,
    why: { 'The child, once shown how it goes on': 'Fitting is supervised by an authorised adult — the child is never left to do it.', 'A crew member who happens to be near': 'Only an authorised adult, under the venue’s child-safeguarding policy.' },
  },
  {
    id: 'cc.q.4',
    covers: 'setups',
    critical: true,
    prompt: 'The children say the monitors are too loud. What comes first?',
    options: ['Lower it at the source, then measure there', 'Give them all earplugs and keep the level as it is', 'Finish the song, then turn it down'],
    correct: 'Lower it at the source, then measure there',
    explain: EXPOSURE,
    why: { 'Give them all earplugs and keep the level as it is': 'Reduce the sound at the source first; protectors are fitted extras, not a licence for level.', 'Finish the song, then turn it down': 'A child’s discomfort is answered at once.' },
  },
  {
    id: 'cc.q.5',
    covers: 'setups',
    prompt: 'Where might a first main pair go for a children’s choir?',
    options: ['A few feet out, a little above their heads', 'Among the front row, at the children’s chest height', 'Behind the choir, near the wall'],
    correct: 'A few feet out, a little above their heads',
    explain: 'One pair, centred, a few feet in front and a little above the children’s heads, aimed at their mouths — then move it in small steps.',
    why: { 'Among the front row, at the children’s chest height': 'Among the children it is in their way and hears whoever is nearest.', 'Behind the choir, near the wall': 'Behind them it hears their backs and the room.' },
  },
  hangDiag('cc', 'the children'),
];

export const E06_LESSON: EnsembleLesson = {
  id: 'E06',
  labId: 'ensembles',
  title: 'Children’s Voices and Choirs',
  subtitle: 'Supervised and safe first: one pair before any close mic, aimed at the children’s mouths — shown from above',
  noun: { one: 'children’s choir', many: 'children’s choirs' },
  model: E06_MODEL,
  micTypeIds: ['arrCard', 'arrOmni', 'arrFig8', 'vocDynCard', 'vocDynSuper'],
  zones: E06_ZONES,
  setupPairs: [{ label: 'The choir’s pair and the soloist’s mic', A: { zone: 'cc.pair', typeId: 'arrCard', pattern: 'cardioid' }, B: { zone: 'cc.solo', typeId: 'vocDynCard', pattern: 'cardioid' }, variants: ['feature'], line: 'A featured child on her own mic over the choir’s pair; check the sum in mono.' }],
  pages,
  scenarios,
  symptoms,
  orderTasks: [
    {
      id: 'cc.prac.order',
      page: 'practice',
      prompt: 'A children’s choir, in order:',
      steps: [
        { text: 'Agree supervision, the layout and the exits with the responsible adults', early: 'Safeguarding and the plan come first.' },
        { text: 'Set stable stands, sandbags and cable ramps; keep the way out clear', early: 'The stage is made safe before the mics go up.' },
        { text: 'Begin with one pair, aimed at the mouths, a few feet out', early: 'One pair first, once the stage is safe.' },
        { text: 'Set gain on the loudest full-group passage', early: 'Gain comes once the pair is up.' },
        { text: 'Bring the monitors up quietly; measure where the children stand', early: 'Monitors last, and only as loud as they need.' },
      ],
      explain: 'Supervision and a safe stage first, one pair aimed at the mouths, gain on the loudest passage — and quiet monitors, measured where the children are.',
    },
  ],
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Children’s solo voices, children’s choirs, school ensembles and youth groups — sometimes beside instruments on the same stage.', src: 'LESSON-CHILD' },
    { title: 'WHAT CHANGES', text: 'The same miking ideas as for adults, with more planning for height, reach, movement, attention, physical safety, hearing and fast-changing voices.', src: 'LESSON-CHILD' },
    { title: 'SAFETY FIRST', text: SAFEGUARDING, src: 'NSPCC-PA' },
    { title: 'ITS SIZE', text: 'This choir is fifteen children in two rows, about 4 m wide, the back row on one 20 cm (8 in) step. Drawn from above only — a typical layout, not a particular choir.', src: 'LESSON-CHILD' },
  ],
  sound: {
    stages: [
      { title: 'Young mouths, lower down', text: 'Each child’s voice leaves the mouth, forward — lower than an adult’s, so a mic set for adults aims over their heads.' },
      { title: 'Quieter and changing', text: 'Young voices vary widely in loudness, pitch range and confidence, and change level quickly.' },
      { title: 'The room joins them', text: 'Reflections blend the voices into one choir sound — what a pair a few feet away hears.' },
    ],
    attack: 'Consonants reach a close mic first and sharpest; a pair a few feet away softens them. Clear words come from the mic’s aim at the mouths and a steady distance.',
    body: 'The children’s blended vowels in the room. A pair hears the blend; a close mic, one child — and every breath. Tendencies — children and rooms vary.',
    head: { diameterMm: 4000, rods: 0, label: 'a children’s choir', strikeSrc: 'LESSON-CHILD' },
  },
  setting: {
    items: [
      { id: 'children', label: 'the children, their feet and the way out', short: 'CHILDREN', note: 'Stable stands with wide bases and sandbags, cable ramps at crossings, clear exit paths; stop the group before moving any stand, boom or cable.', prov: { kind: 'sourced', src: 'LESSON-CHILD', quote: 'stop the group before moving a stand, boom, cable, or hanging microphone. Secure stands with appropriate bases, sandbags (L8)' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'adults', label: 'supervision', short: 'SUPERVISION', note: SAFEGUARDING, prov: { kind: 'sourced', src: 'NSPCC-PA', quote: 'It’s vital that children are appropriately supervised at all times.' }, tag: 'SAFEGUARDING', scene: 'all' },
      { id: 'hearing', label: 'the children’s hearing', short: 'HEARING', note: EXPOSURE, prov: { kind: 'sourced', src: 'AAO-NIHL', quote: '"120 dB LCpeak" and "94 dB LAeq, 15min" for venues targeted specifically at children (quoting the WHO 2022 standard)' }, tag: 'SAFETY', scene: 'all' },
      { id: 'rig', label: 'anything hung above the stage', short: 'RIGGING', note: 'Never a mic hung over the children’s heads without a competent rigger and the venue’s approval; in front of the mouths, aimed at the back row.', prov: { kind: 'sourced', src: 'LESSON-CHILD', quote: 'Never hang a microphone over children’s heads without a competent rigger and venue approval (L38)' }, tag: 'VENUE ONLY', scene: 'all' },
      { id: 'monitor', label: 'the children’s monitor', short: 'MONITOR', note: 'Low in level, in the mics’ rejection, carrying the piano or the band — never the choir’s own mics, never pointed into an open choir mic.', prov: { kind: 'sourced', src: 'S-CHOIR', quote: 'never mix choir mic channels into the choir monitors' }, tag: 'FEEDBACK', scene: 'stage' },
      { id: 'pa', label: 'the PA and the band', short: 'PA · BAND', note: 'The fewest open mics, quiet monitors; compare the natural choir with the reinforced one by muting — a small room may need little or none.', prov: { kind: 'sourced', src: 'LESSON-CHILD', quote: 'compare the natural acoustic level with the reinforced level by muting and unmuting the choir channels (L37)' }, tag: 'SPILL', scene: 'stage' },
      { id: 'room', label: 'the room and its noise', short: 'ROOM', note: 'Air handling, riser movement, page turns and feet: a distant pair hears them. Several short takes beat one long, loud one.', prov: { kind: 'sourced', src: 'LESSON-CHILD', quote: 'Capture several short takes rather than forcing a long, loud rehearsal (L33)' }, tag: 'PART OF THE SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a gain-before-feedback and supervision problem. The fewest open choir mics, in front and a little above the mouths, aimed at the group; monitors low, in the mics’ rejection and never carrying the choir mics; the level measured where the children stand — and never provoke feedback.',
    studio: 'A RECORDING: one pair or a carefully placed area mic first — not a close mic on every child; move it in small steps on loudspeakers; spots only for a section the pair cannot carry; several short takes.',
  },
  diagnostic,
  practice: {
    task: 'Arrange a small children’s choir in two rows and begin with one stereo pair; adjust its height and distance for front-to-back balance and the words. Add two area mics 3:1 apart and mute-check them. Measure at the children’s positions. With the responsible adults’ and the venue’s agreement, log what you tried below.',
    fields: [
      { id: 'choir', label: 'The choir: rows, risers, ages (in general terms)', kind: 'text' },
      { id: 'goal', label: 'What it is for', kind: 'choice', choices: ['recording', 'reinforcement', 'both'] },
      { id: 'pair', label: 'Main pair: method, distance, height', kind: 'text' },
      { id: 'safety', label: 'Supervision, stands, cables and exits checked', kind: 'text' },
      { id: 'level', label: 'Level measured at the children’s positions, and any change made', kind: 'text' },
      { id: 'notes', label: 'What you heard: rows, words, mono (in words)', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The children are drawn from above only, at 0.76 of the adult figure (lips about 1.18 m, heads about 1.31 m above the floor): a drawing default — no source gives a child’s size, and real ages vary.', dims: [] },
    { text: 'Fifteen children at a 48 cm pitch, the front row on the floor, the back row on one 8 in (20 cm) step, 18 in (46 cm) deep: the step is the maker’s, the rest drawing defaults.', dims: [] },
    { text: `Two area mics drawn ${((2 * 1260) / 1000).toFixed(2)} m apart, 0.62 m in front and 0.34 m above the front heads; their nearest children about ${(E06_31.rA / 1000).toFixed(2)} m away, so 3:1 holds (≈ ${E06_31.ratio.toFixed(1)}:1).`, dims: [] },
    { text: 'The featured child’s stand mic within about 10 cm uses the adult stage row (no child-specific distance was found); "a few feet" for the pair is drawn 0.6–2 m out, 0.3–1.3 m above the heads.', dims: [] },
  ],
  live: { wedges: E06_WEDGES },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. With children, safety and safeguarding come first: supervision at all times, a responsible adult in charge of every mic, stable stands and clear exits, quiet levels measured where the children stand. Then one pair before any close mic, aimed at their mouths. Every group, room and production is different: experiment gently and trust your ears. The lab is silent and draws the children from above only, as a simplified picture: typical layouts, ideal patterns, straight paths and distances read from the drawing.',
  copy: { words: { ...ensembleWords('children’s choir'), player: 'children', inside: 'among the children', outside: 'clear of the children', axis: 'the line toward the children', facing: 'facing the children', shield: 'children in path', viewSide: 'From the hall (the children not drawn),' } },
  ensemble: {
    seatings: { choir: 'choir.children', feature: 'choir.childrenSolo' },
    setups: E06_SETUPS,
    placeZones: E06_PLACE,
    worked: { choir: 'xy', feature: 'xy' },
    views: ['plan'],
    meet: {
      figureTitle: 'A CHILDREN’S CHOIR',
      figureBadge: 'From above, as the conductor faces it · drawn from above only · a typical layout',
      sectionsNote: 'Sopranos to the conductor’s left, altos to the right, in two rows — the back row on one step. Switch SEATING for a featured child at a stand mic. Tap a section.',
      soundNote: 'The arcs show WHERE each young voice leaves — the mouth, forward — never how loud. Their mouths are lower than adults’: aim the mics at them, not over their heads.',
      mainAt: PAIR_FAR,
    },
    before: [
      { title: 'SAFEGUARDING', text: SAFEGUARDING },
      { title: 'HEARING', text: EXPOSURE },
      { title: 'A SAFE STAGE', text: 'Stable stands with appropriate bases or sandbags, ramps over cable crossings, water, costumes and moving scenery kept away from connectors and power; nothing that restricts breathing, movement or a safe exit.' },
      { title: 'LISTEN FIRST', text: 'Hear the children unamplified from the audience or the recording position; the director can often fix the balance with the layout or the risers before any gain.' },
    ],
    safety: 'Supervision at all times; a responsible adult controls every mic. Stable stands, sandbags and cable ramps; exits clear; stop the group before moving anything. Never a mic over the children’s heads without a competent rigger and the venue’s approval. Quiet monitors, the level measured where the children stand; never provoke feedback.',
    workedWords: {
      begin: 'After our research, this is where we recommend you begin with a children’s choir: one pair, centred, a few feet in front and a little above their heads, aimed at their mouths — a place to start and compare, not a rule.',
      clearance: 'The stand’s wide base in front of the first row, clear of the children’s feet and the way out; a sandbag on its base, its cable taped flat or under a ramp, away from the children’s path.',
      height: 'A little above the children’s heads — lower than for adults — so it aims at their mouths and the back row. Too high and they turn dull and distant; too low and it hears the riser and the front row. (From above, the height is in the readout.)',
      forward: 'A few feet in front of the first row. Nearer favours the front row and the words; farther, the blend and the room.',
    },
    learnZones: [
      'What you just did, in words. After our research, the blue zones are where we recommend you begin with the pair’s centre — near, about 0.6–1.2 m (2–4 ft) in front, 0.3–0.9 m (1–3 ft) above the children’s heads; or farther and higher, where the whole choir fills the pair’s angle. Places to start and compare, not a best place.',
      'From above you see how far forward and how wide; the height is in the readout. Aim at the mouths: children stand lower than adults.',
      'Change one thing at a time and compare at a consistent level — and stop the group before any stand is moved.',
    ],
  },
};
