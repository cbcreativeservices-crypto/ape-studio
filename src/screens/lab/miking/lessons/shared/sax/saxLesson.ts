/**
 * THE SAXOPHONE FAMILY'S LESSON — the pages as DATA for any of the four
 * saxophones (soprano, alto, tenor, baritone), built once with the
 * instrument's words dropped in; each lesson supplies what is its own (the
 * zones, the four ORIENT facts, the instrument's own checks, the setup
 * briefs, the neighbours on the plan).
 *
 * Words: the owner's lessons (docs/labs/miking/source_text/*-Saxophone-
 * Miking-Technique-Research.txt, cited "L<n>" in COMMENTS only) with the
 * fixes logged in docs/labs/miking/CORRECTIONS_LOG.md (SX-01 …) applied —
 * above all the radiation wording: sound leaves at the FIRST open tone hole
 * (the open hole nearest the mouthpiece), not the "last open holes"
 * (alto_sax/SOURCES.md §1, BATCH3 §2.1); and a supercardioid's nulls sit
 * about 125° off the front, toward the rear — not at the sides (§2.2).
 *
 * OWNER RULING 2026-10-04 — suggested starting points, never dogma; no
 * source, brand or model in learner text; no badges. FULLY SILENT.
 *
 * Item-writing rules (LESSON_JOURNEY §5, test/mikingItemBalance.test.ts):
 * the correct option is at most 1.25 × the mean length of the others and the
 * longest in at most a quarter of the items; wrong options are real
 * misconceptions without absolute words, each with its own "why"; reasoning,
 * not recall. Option order is shuffled on screen (itemOrder.ts).
 */
import type { DiagnosticItem, DocumentedZone, Lesson, MikingScenario, OrderTask, OrientFact, PageContent, PageId, SettingItem, SetupReason, SetupTask, Symptom, Wedge } from '../../../engine/model/types.ts';
import type { LessonCopy } from '../../../engine/model/copy.ts';
import { micRatingCheck } from '../../../engine/model/sharedItems.ts';
import type { SaxFamily } from './saxFamily.ts';

/** What a scenario needs before it gets its id and page. */
export type ItemBody = Omit<MikingScenario, 'id' | 'page'>;

export type SaxLessonCfg = {
  id: string;
  /** The id prefix of the lesson's checks ("as" for the alto). */
  pfx: string;
  title: string;
  subtitle: string;
  F: SaxFamily;
  /** "alto"; "Alto"; "alto saxophone". */
  short: string;
  Short: string;
  zones: DocumentedZone[];
  /** Which zones the shared pages use. */
  use: { worked: string; live: string; twoA: string; twoB: string; twoBType: string };
  orient: readonly OrientFact[];
  /** The instrument's own checks: the placement page's third, the
   *  microphone page's fourth (the wireless low cut against its lowest
   *  note), and the quick check's first (which way its bell points). */
  place3: ItemBody;
  mic4: ItemBody;
  q1: Omit<DiagnosticItem, 'id' | 'covers'>;
  setup: (r: Reasons) => SetupTask[];
  /** The plan's neighbours (scene 'kit'): the section beside the player. */
  neighbours: readonly SettingItem[];
  stage: string;
  studio: string;
  /** The placement page's words for this horn. */
  placementReveal: string;
  typeNotes: Readonly<Record<string, string>>;
  learnIntro: string;
  /** The worked example's aim sentence, when the horn is not curved. */
  workedAim?: string;
  /** The Studio-or-live page's cardioid line, when the horn is not curved. */
  cardioidReveal?: string;
  /** Extra internal unknowns. */
  unknowns?: { text: string; dims: string[] }[];
  wedges: Wedge[];
  accuracyExtra: string;
  /** The context page's view boxes (plan, side). */
  contextBoxes: { plan: { u0: number; u1: number; v0: number; v1: number }; side: { u0: number; u1: number; v0: number; v1: number } };
};

export type Reasons = { POWER: SetupReason; DOC: SetupReason; CLEAR: SetupReason; BRAND: SetupReason; LOUD: SetupReason };

export function buildSaxLesson(c: SaxLessonCfg): Lesson {
  const p = c.pfx;
  const s = c.short;
  const S = c.Short;
  const name = c.F.row.name;
  const id = (x: string) => `${p}.${x}`;
  const sc = (x: string, page: PageId, b: ItemBody): MikingScenario => ({ id: id(x), page, ...b });

  const pages: Record<PageId, PageContent> = {
    instrument: {
      title: `Meet the ${s} sax`,
      goal: `Get to know the ${name} — what it is, where you meet it, what it does in the music, and its parts — before any microphone.`,
      credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
      takeaway: c.F.row.id === 'soprano' ? 'A reed on the mouthpiece drives the air in a straight conical tube; keys open the tone holes; the bell points down and forward. The player holds it in front, standing or seated, and moves with the music.' : `A reed on the mouthpiece drives the air in a conical tube; keys open the tone holes along the body; the bell curves up beside it. The player holds the ${s} on a strap, standing or seated, and moves with the music.`,
    },
    sound: {
      title: 'How it makes its sound',
      goal: `See how breath becomes sound — the reed, the air column, the first open tone hole — and where the sound leaves the ${s}, note by note. Shown, never played.`,
      credit: { scenarios: [id('snd.1'), id('snd.2'), id('snd.3')], interactive: 'soundPath', note: 'Step the sequence through to the end (or play it once), and answer the three checks.' },
      takeaway: 'Most of a note leaves through the first open tone hole and the open holes just past it; the bell carries the lowest notes and the high harmonics. Where the sound leaves moves with every note — a close mic hears that move; a little distance blends it.',
    },
    setting: {
      title: 'Where it sits',
      goal: `Know where the ${s} sits — the player’s posture, the bell’s swing, the hands on the keys, the music stand and the section around it — what a stage and a studio add, and what to do before any mic.`,
      credit: { scenarios: [id('set.1'), id('set.2'), id('set.3')], note: 'Answer the three checks.' },
      takeaway: 'The bell swings as the player moves, and the hands never leave the keys: no stand, clip or cable goes there. Ask the player first, hear the horn unamplified, and protect your hearing.',
    },
    microphone: {
      title: 'Choose the microphone',
      goal: `Choose a mic for the ${s} by its properties — pattern, power, size and mount — not by its brand.`,
      credit: { scenarios: [id('mic.1'), id('mic.2'), id('mic.3'), id('mic.4'), id('rec.1')], note: 'Answer the five checks (one reaches back to how the sax sounds).' },
      takeaway: 'Dynamics need no power; condensers and the bell clip need phantom power. A clip goes on the bell rim only, made for that bell. No mic type is best for every horn, room and show.',
    },
    placement: {
      title: 'Placement Studio',
      goal: 'Start where we recommend you begin — a few centimetres above the bell, aimed at the sound holes, clear of the player — then move the mic and see what changes.',
      credit: { scenarios: [id('place.1'), id('place.2'), id('place.3'), id('rec.2')], interactive: 'twoZones', note: 'Rest the mic, clear of every part, inside two different recommended starting points, and answer the four checks. The worked example earns nothing on its own — it is there to read.' },
      takeaway: 'A recommended zone is a place to begin, measured from a named part — the bell, the tone holes — not a rule. Toward the bell tends brighter, toward the holes warmer with more key noise, farther blends the horn and the room. Clearance comes first.',
    },
    context: {
      title: 'Studio or live',
      goal: 'Aim the mic so its pattern’s rejection faces the player’s wedge — and know what a pattern cannot do, and why a loud stage and a good studio room lead to different choices.',
      credit: { scenarios: [id('ctx.1'), id('ctx.2'), id('ctx.studio'), id('rec.3')], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the wedge sits in the rejection. STUDIO: answer the decision card. Then the three checks.' },
      takeaway: 'A cardioid rejects most straight behind; a supercardioid’s nulls sit about 125° off the front, toward the rear — not at the sides. Real nulls are shallower than the picture, and no mic position alone prevents feedback.',
    },
    twoMic: {
      title: 'Two microphones',
      goal: `See why a close and a farther mic on one ${s} can sound hollow together, how the arrival-time difference places comb notches, and what the polarity switch does and does not change.`,
      credit: { scenarios: [id('two.1'), id('two.2'), id('two.3'), id('two.4')], interactive: 'polarityVsDelay', note: 'Flip polarity both ways AND move a mic so the delay changes, then answer the four checks.' },
      takeaway: 'Two mics at different distances hear the horn at different times: some pitches cancel in the sum. Move or rebalance first; polarity flips the sign and never removes a delay. Judge the pair in mono, at matched levels.',
    },
    troubleshoot: {
      title: 'Troubleshoot',
      goal: 'Match each symptom to the first things to check.',
      credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
      takeaway: 'Check the physical cause first — what the mic hears (bell, holes or both), its distance and aim, the player’s movement, every gain stage and any filter — before reaching for tone controls.',
    },
    practice: {
      title: 'Practice',
      goal: `Set up one ${s} mic in the right order, choose and justify a setup for two briefs, and say what would justify a second mic.`,
      credit: { scenarios: [id('prac.order'), id('prac.gain'), id('prac.setup1'), id('prac.setup2'), id('prac.3'), id('mix.1'), id('mix.2'), id('mix.3')], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real horn and its player.' },
      takeaway: 'Safe clearance from the bell’s swing and the hands, correct power and level checks, pattern reasoning and an accurate account of polarity versus delay pass. A brand or a “loudest” position do not — and more than one setup can pass.',
    },
  };

  /* L6 / SOURCES §1 (first open hole); L9–L11 (positions); L17 (headroom);
   * L24–L26 (clip); the troubleshooting tables; NIOSH via micRatingCheck. */
  const scenarios: MikingScenario[] = [
    sc('snd.1', 'sound', {
      prompt: `The player fingers a middle note, with several holes open from the bell end. Where does most of that note leave the ${s}?`,
      options: ['Through the first open hole and the open holes just past it', 'Out of the bell only, the way a trumpet’s note leaves its bell', 'Through the closed pads, which pass the sound through the leather'],
      correct: 'Through the first open hole and the open holes just past it',
      explain: 'The first open hole — the open hole nearest the mouthpiece — acts as the end of the air column, so most of the note leaves there and at the open holes just past it. The bell still carries the note’s high harmonics.',
      why: {
        'Out of the bell only, the way a trumpet’s note leaves its bell': 'A trumpet has no tone holes. On a saxophone, open holes let most of a note out long before it reaches the bell.',
        'Through the closed pads, which pass the sound through the leather': 'A closed pad seals its hole. The sound leaves where holes are open — mostly the first open one.',
      },
    }),
    sc('snd.2', 'sound', {
      prompt: 'The player climbs the scale one note at a time, without the octave key. What does the first open hole do?',
      options: ['It moves up the body, toward the mouthpiece', 'It moves down the body, toward the bell end', 'It stays where it is; only the pads change'],
      correct: 'It moves up the body, toward the mouthpiece',
      explain: 'Each higher note opens one more hole above the last, so the air column gets shorter and its end — the first open hole — climbs toward the mouthpiece. A close mic fixed on the body hears the sound move along it.',
      why: {
        'It moves down the body, toward the bell end': 'That is the way it goes as the notes go DOWN: closing holes lengthens the air column.',
        'It stays where it is; only the pads change': 'Opening one more hole moves the end of the air column — that is how the note rises.',
      },
    }),
    sc('snd.3', 'sound', {
      prompt: `A mic sits a few centimetres into the ${s}’s bell. Why can many notes sound thinner there than they do in the room?`,
      options: ['Much of each note leaves through open holes up the body', 'The bell only carries the lowest harmonics of each note', 'The keys block the sound before it can reach the bell'],
      correct: 'Much of each note leaves through open holes up the body',
      explain: 'The bell carries every note’s high harmonics, but most of a note with open holes leaves through the first open hole and the holes just past it. A mic deep at the bell hears a bright, partial picture; a little distance, or an aim between the bell and the keys, hears more of the whole.',
      why: {
        'The bell only carries the lowest harmonics of each note': 'It is the other way round for most notes: the bell carries their HIGH harmonics, and the open holes carry most of the rest.',
        'The keys block the sound before it can reach the bell': 'The keys only seal holes. A note leaves where the holes are open — up the body — not through the keys.',
      },
    }),
    micRatingCheck({ id: id('set.1'), page: 'setting', mic: `${s} mic`, loudest: `the loudest ${s} note` }),
    sc('set.2', 'setting', {
      prompt: `You set a stand for a ${s} mic. Which space must the stand’s base and tube stay out of?`,
      options: ['The space the bell sweeps as the player moves and turns', 'The floor between the music stand and the audience side', 'The space straight behind the player’s back'],
      correct: 'The space the bell sweeps as the player moves and turns',
      explain: 'Players move with the music, and the horn moves with them: the bell swings as they turn and sway. Keep the stand’s base and tube outside that sweep, and the cable off the walking path.',
      why: {
        'The floor between the music stand and the audience side': 'A stand in front is normal for a horn mic — as long as it stays out of the bell’s swing and the player’s sight line to the music.',
        'The space straight behind the player’s back': 'Behind the player is out of the horn’s way. The space to protect is where the bell swings.',
      },
    }),
    sc('set.3', 'setting', {
      prompt: 'Before you place any mic, what do you ask the saxophonist?',
      options: ['How they stand or sit, how they move, what sound they want', 'Which make of saxophone and mouthpiece they are playing today', 'Whether they could play more quietly so the mic can cope'],
      correct: 'How they stand or sit, how they move, what sound they want',
      explain: 'Their posture and movement decide where a stand can safely go, and the sound they want decides which starting point to try first. Then hear the horn unamplified: quiet and loud, low and high.',
      why: {
        'Which make of saxophone and mouthpiece they are playing today': 'The make does not change where to begin. Their posture, their movement and the sound they want do.',
        'Whether they could play more quietly so the mic can cope': 'Set the mic and the gain for how they really play. Asking for less level changes the music, not the setup.',
      },
    }),
    sc('mic.1', 'microphone', {
      prompt: 'The only spare input has no phantom power. Which of this page’s mics can you still use?',
      options: ['The two instrument dynamics: neither one needs power', 'The bell clip, because its capsule is so very small', 'The large condenser, if it stays well back from the bell'],
      correct: 'The two instrument dynamics: neither one needs power',
      explain: 'Dynamic mics need no power. The bell clip’s miniature and the large condenser are both condensers and need phantom power — the miniature through its adapter.',
      why: {
        'The bell clip, because its capsule is so very small': 'Size does not change what a condenser needs: the miniature still needs phantom power, through its adapter.',
        'The large condenser, if it stays well back from the bell': 'Distance does not change what a condenser needs: it still needs phantom power.',
      },
    }),
    sc('mic.2', 'microphone', {
      prompt: `A player wants to walk around the stage. Where can a ${s} mic be clipped?`,
      options: ['On the bell rim, with a clip made for that bell', 'On a key rod, which is where the clip holds firmest', 'On the neck, near the cork and the mouthpiece'],
      correct: 'On the bell rim, with a clip made for that bell',
      explain: 'A saxophone clip is made to grip the bell rim. Keys, rods, pads, guards and the neck cork move or are fragile; nothing clamps there. Fit it with the player’s agreement, and test the strap, the hands and the cable as they move.',
      why: {
        'On a key rod, which is where the clip holds firmest': 'Rods turn as the keys move, and a clip there can bend them or stop a key closing. Clips go on the bell rim only.',
        'On the neck, near the cork and the mouthpiece': 'The neck cork and the octave key are there, and the player’s face is close. Clips go on the bell rim, made for it.',
      },
    }),
    sc('mic.3', 'microphone', {
      prompt: 'Engineers use condensers for detail, dynamics for close live work and ribbons for a rounder top. What does that tell you?',
      options: ['Each suits an aim — choose by sound and by setting', 'A condenser is the more accurate mic on a saxophone', 'Dynamics belong on stage; a studio needs a condenser'],
      correct: 'Each suits an aim — choose by sound and by setting',
      explain: 'They are options for different aims, not a ranking. Choose by pattern, power, size and mount for this horn and this room — and compare by ear. A ribbon needs its own care with air blasts and phantom power.',
      why: {
        'A condenser is the more accurate mic on a saxophone': 'Accuracy is not the only aim, and a condenser is not automatically right. Compare on this horn, by ear.',
        'Dynamics belong on stage; a studio needs a condenser': 'Dynamics work in studios too, and condensers on stages. Choose by the aim and the setting.',
      },
    }),
    sc('mic.4', 'microphone', c.mic4),
    sc('rec.1', 'microphone', {
      prompt: 'FROM EARLIER · A mic close to the middle of the key stack hears more of which sound?',
      options: ['The notes leaving the open holes nearby, and the keys', 'Only the lowest notes, the ones that leave the bell', 'Mostly the breath and the reed noise at the mouthpiece'],
      correct: 'The notes leaving the open holes nearby, and the keys',
      explain: 'Close to the stack, the mic hears the notes whose first open holes are near it — and the pads and keys. Notes that leave elsewhere, and the bell’s harmonics, come in weaker.',
      why: {
        'Only the lowest notes, the ones that leave the bell': 'The lowest notes leave the bell, away from the stack. Close to the stack it is the open holes nearby that it hears most.',
        'Mostly the breath and the reed noise at the mouthpiece': 'The mouthpiece is at the top, by the player’s mouth. Near the stack, the open holes and the keys are what it hears.',
      },
    }),
    sc('place.1', 'placement', {
      prompt: 'A starting point says “5 to 10 cm from the bell”. Your readout says 7 cm from the tone holes. Are you in it?',
      options: ['No — that number counts only from the part it names', 'Yes — 7 cm sits inside the 5 to 10 cm band it gives', 'Yes, provided that the mic is also aimed at the bell'],
      correct: 'No — that number counts only from the part it names',
      explain: 'A distance only means something with the part it is measured from — which is why every readout here names it. 7 cm from the holes can be 40 cm from the bell.',
      why: {
        'Yes — 7 cm sits inside the 5 to 10 cm band it gives': 'Same number, different part: 7 cm from the tone holes is somewhere else entirely relative to the bell.',
        'Yes, provided that the mic is also aimed at the bell': 'Aim is a separate thing to check. The distance must be read from the bell, the part the starting point names.',
      },
    }),
    sc('place.2', 'placement', {
      prompt: 'You move the mic from above the bell toward the middle of the key stack. What should you listen for?',
      options: ['A warmer, fuller sound, with more key and pad noise', 'A brighter sound, and less of the keys than before', 'The same sound — the bell and the holes sound alike'],
      correct: 'A warmer, fuller sound, with more key and pad noise',
      explain: 'Toward the holes tends to sound warmer and fuller, and the mic hears more fingering noise — pads, keys, clicks. Tendencies to check on this horn and this player.',
      why: {
        'A brighter sound, and less of the keys than before': 'Brighter is the bell’s tendency. Toward the key stack tends to be warmer — with more key noise.',
        'The same sound — the bell and the holes sound alike': 'The holes and the bell carry different parts of the sound; moving between them changes the balance.',
      },
    }),
    sc('place.3', 'placement', c.place3),
    sc('rec.2', 'placement', {
      prompt: 'FROM EARLIER · You move the stand closer to reach a new zone. What must its base stay out of?',
      options: ['The space the bell swings through as the player moves', 'The front of the stage, so the audience sees the horn', 'The space beside the music stand, so it does not shake'],
      correct: 'The space the bell swings through as the player moves',
      explain: 'The bell moves with the player. Stop the player, move the stand, and keep its base and tube out of the swing — and the cable off the walking path.',
      why: {
        'The front of the stage, so the audience sees the horn': 'How it looks is not the safety question. The bell’s swing and the player’s movement come first.',
        'The space beside the music stand, so it does not shake': 'Beside the music stand is usually fine. The space to keep clear is where the bell swings.',
      },
    }),
    sc('ctx.1', 'context', {
      prompt: 'Live, what can favour a close, directional mic on the sax?',
      options: ['Stage spill, and the gain you can reach before feedback', 'A close directional mic gives the most natural sound', 'The room usually sounds better on a stage than in a studio'],
      correct: 'Stage spill, and the gain you can reach before feedback',
      explain: 'Those are common live reasons. In a good studio room, a little more distance — or a room mic — may help the horn sound whole.',
      why: {
        'A close directional mic gives the most natural sound': 'Close and directional tends to be brighter and more partial. It is chosen live for spill and feedback.',
        'The room usually sounds better on a stage than in a studio': 'That is usually the studio’s case: a good room is a reason to step back, not forward.',
      },
    }),
    sc('ctx.2', 'context', {
      prompt: 'The wedge sits behind your supercardioid, about 125° off its front axis. Is that near where the mic rejects most?',
      options: ['Yes — its deepest rejection lies near 125°, off the rear axis', 'No — a directional mic rejects most of all directly at its back', 'No — it rejects most at its sides, 90° off the front axis'],
      correct: 'Yes — its deepest rejection lies near 125°, off the rear axis',
      explain: 'A supercardioid’s deepest rejection sits on a cone about 125° off the front — toward the rear but off the axis; straight behind it hears a little. A real null is shallower than the drawing, and least deep in the lows.',
      why: {
        'No — a directional mic rejects most of all directly at its back': 'Only a cardioid rejects most straight behind. A supercardioid has a small rear lobe there.',
        'No — it rejects most at its sides, 90° off the front axis': 'At 90° a supercardioid still hears a fair amount. The rejection deepens toward the rear, near 125°.',
      },
    }),
    sc('ctx.studio', 'context', {
      prompt: 'Studio, a good room, no monitors on the floor. What could justify moving the mic farther from the horn?',
      options: ['The room adds to the sound, and the whole horn blends', 'A farther mic picks up a louder, fuller saxophone', 'Farther away, the mic will hear less of the room itself'],
      correct: 'The room adds to the sound, and the whole horn blends',
      explain: 'A common studio reason: a little distance lets the holes and the bell blend, and a good room adds to it. Judge it by ear, at matched levels — more room also means more of everything else.',
      why: {
        'A farther mic picks up a louder, fuller saxophone': 'Farther is quieter, not louder. Distance is chosen for blend and room; the gain makes up the level.',
        'Farther away, the mic will hear less of the room itself': 'The reverse: farther away, the mic hears MORE of the room.',
      },
    }),
    sc('rec.3', 'context', {
      prompt: 'FROM EARLIER · A mic close to the bell, on a melody that climbs. Why can its tone change from note to note?',
      options: ['Each note leaves from a new first open hole', 'The bell itself grows and shrinks as the notes climb', 'The reed stops vibrating for the very highest notes'],
      correct: 'Each note leaves from a new first open hole',
      explain: 'As the notes change, so does the first open hole — and with it where most of the sound leaves. A close mic hears that move; a little distance evens it out.',
      why: {
        'The bell itself grows and shrinks as the notes climb': 'The bell does not change size. What changes is where each note leaves: its first open hole.',
        'The reed stops vibrating for the very highest notes': 'The reed vibrates for every note. It is where the sound leaves that changes.',
      },
    }),
    sc('two.1', 'twoMic', {
      prompt: 'You flip mic B’s polarity. What happens to the arrival-time difference between the two mics?',
      options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so both arrivals line up in time once more', 'It doubles, because the flipped copy now arrives later'],
      correct: 'Nothing: polarity flips the sign; the delay stays the same',
      explain: 'Polarity reverses the signal’s sign. It does not remove a delay caused by sound reaching the mics at different times. The notches move; Δt does not.',
      why: {
        'It drops to zero, so both arrivals line up in time once more': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still where they were.',
        'It doubles, because the flipped copy now arrives later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
      },
    }),
    sc('two.2', 'twoMic', {
      prompt: 'The close mic hears the horn 1 ms before the farther mic. Summed at equal level, same polarity: where is the first notch (simplified model)?',
      options: ['500 Hz, then 1.5 kHz, 2.5 kHz …', '1 kHz, then 2 kHz, 3 kHz, 4 kHz …', '250 Hz, then 750 Hz, 1.25 kHz …'],
      correct: '500 Hz, then 1.5 kHz, 2.5 kHz …',
      explain: 'The first cancellation is where the delay is half a period: f = 1 ÷ (2 × 0.001 s) = 500 Hz, then odd multiples. Inverted, the notches sit at 0, 1 kHz, 2 kHz … instead.',
      why: {
        '1 kHz, then 2 kHz, 3 kHz, 4 kHz …': 'That is the INVERTED set (whole multiples of 1 ÷ Δt). Same polarity cancels where the delay is half a period: 500 Hz.',
        '250 Hz, then 750 Hz, 1.25 kHz …': 'That needs a 2 ms delay. With 1 ms the first notch is at 1 ÷ (2 × 0.001 s) = 500 Hz.',
      },
    }),
    sc('two.3', 'twoMic', {
      prompt: 'Does a 3:1 spacing make a close mic and a farther mic on one sax phase-coherent?',
      options: ['No: 3:1 is about separate sources; judge this pair in mono', 'Yes, once the farther mic is three times as far away', 'Yes, provided both mics share the same cardioid pattern'],
      correct: 'No: 3:1 is about separate sources; judge this pair in mono',
      explain: '3:1 can reduce spill between mics on DIFFERENT sources. A close and a farther mic on one horn hear the same source at different times, so the ratio guarantees nothing.',
      why: {
        'Yes, once the farther mic is three times as far away': '3:1 is about spill between mics on different sources. This pair hears one source, so the ratio guarantees nothing.',
        'Yes, provided both mics share the same cardioid pattern': 'Matching patterns does not line up arrival times. Judge the pair in mono, in both polarity states.',
      },
    }),
    sc('two.4', 'twoMic', {
      prompt: 'With mic B inverted the pair sounds fuller, and reads 2 dB louder. What do you conclude?',
      options: ['Not yet: match the levels, then compare both states in mono', 'Inverted is the right setting for a saxophone, so keep it on', 'Normal polarity was wrong, because it was the quieter one'],
      correct: 'Not yet: match the levels, then compare both states in mono',
      explain: 'A louder state sounds “better” at first. Compare at matched level, in mono, across the whole part — and move a mic before trusting a switch.',
      why: {
        'Inverted is the right setting for a saxophone, so keep it on': 'No setting is right for an instrument: the result depends on where the mics are.',
        'Normal polarity was wrong, because it was the quieter one': 'Quieter is not wrong. Match levels, then judge which state keeps the body.',
      },
    }),
    sc('prac.gain', 'practice', {
      prompt: 'Quiet phrases sit well below the overload light, but the player’s loudest high notes light it. What do you do?',
      options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until the loudest notes sound clean again', 'Ask the player to play their loudest notes more softly'],
      correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
      explain: 'Set the input gain with headroom for the strongest notes the player really plays, and watch the overload light — in the mic, any wireless pack, the preamp and the converter. A lowered fader does not undo clipping at the input; use a pad only as its manual allows.',
      why: {
        'Pull the channel fader down until the loudest notes sound clean again': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
        'Ask the player to play their loudest notes more softly': 'Set the gain for the strongest notes the player intends to play — not for a gentler soundcheck.',
      },
    }),
    sc('prac.3', 'practice', {
      prompt: 'What would justify a second channel on one saxophone?',
      options: ['Each mic works alone, the pair adds something, it holds in mono', 'Two channels give the mix engineer more to work with later', 'The sax needs more level in the mix than a single mic can give it'],
      correct: 'Each mic works alone, the pair adds something, it holds in mono',
      explain: 'A close mic and a room mic, or a clip and a stand, blend two perspectives. If the pair sounds hollow or uneven, move or rebalance — or leave the second mic out. One well-placed mic is a complete setup.',
      why: {
        'Two channels give the mix engineer more to work with later': 'More channels also add spill and interactions. A second mic should earn its place in the combined sound.',
        'The sax needs more level in the mix than a single mic can give it': 'Level comes from gain and the fader, not from another mic.',
      },
    }),
    sc('mix.1', 'practice', {
      prompt: 'A starting point says “30 to 60 cm”. Before you place the mic, what else do you need?',
      options: ['The part it is measured from, and where it should aim', 'The make of the saxophone, so the number fits its size', 'Nothing — the number already says where the mic goes'],
      correct: 'The part it is measured from, and where it should aim',
      explain: 'A distance belongs to its named part — the bell, the holes — and a starting point may also name an aim (“a third of the way up the horn”). Clearance is a separate check again.',
      why: {
        'The make of the saxophone, so the number fits its size': 'A starting point’s distance belongs to its named part; the make does not change that.',
        'Nothing — the number already says where the mic goes': 'A distance means nothing without its reference part; aim and clearance are separate checks.',
      },
    }),
    sc('mix.2', 'practice', {
      prompt: 'A wedge sits about 125° off a supercardioid’s front. What can you expect?',
      options: ['Strong rejection on paper; less in reality, least in the lows', 'Silence from the wedge, because it sits right in the null', 'More of it than from straight behind, where it rejects the most'],
      correct: 'Strong rejection on paper; less in reality, least in the lows',
      explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — use the null to aim, not to promise silence.',
      why: {
        'Silence from the wedge, because it sits right in the null': 'A null is infinitely deep only on paper. Real mics reject far less.',
        'More of it than from straight behind, where it rejects the most': 'Straight behind, a supercardioid has a small rear lobe; its deepest rejection is off the rear axis, near 125°.',
      },
    }),
    sc('mix.3', 'practice', {
      prompt: 'Two mics on one horn sound thin together. Which change removes the arrival-time difference itself?',
      options: ['Moving a mic so that the two paths are closer to equal', 'Flipping the polarity switch on one of the two mics', 'Turning the later mic up until it matches the first'],
      correct: 'Moving a mic so that the two paths are closer to equal',
      explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
      why: {
        'Flipping the polarity switch on one of the two mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
        'Turning the later mic up until it matches the first': 'Level changes the depth of the notches, not where they are or the delay behind them.',
      },
    }),
  ];

  /* The troubleshooting tables (L48–L75). */
  const symptoms: Symptom[] = [
    {
      id: id('s.thin'),
      observation: 'Thin or nasal tone',
      firstChecks: 'Is the mic hearing only the bell? Compare a position that takes in the holes as well.',
      options: ['Whether it hears only the bell; try a holes-and-bell spot', 'Boost the low mids with EQ until the tone sounds full again', 'Move the mic deeper into the bell to catch more of the note'],
      correct: 'Whether it hears only the bell; try a holes-and-bell spot',
      explain: 'A bell-only view misses the open holes, where much of each note leaves. Compare a spot that hears the holes and the bell together before reaching for EQ.',
      why: {
        'Boost the low mids with EQ until the tone sounds full again': 'EQ cannot add what the mic is not hearing. Check what it hears first: the bell alone, or the holes too.',
        'Move the mic deeper into the bell to catch more of the note': 'Deeper into the bell hears even less of the holes. Try a spot that takes in both.',
      },
    },
    {
      id: id('s.keys'),
      observation: 'Too much key and pad noise',
      firstChecks: 'Mic too close to the rods and pads, or aimed straight at the keys? Back off or change the aim without losing body.',
      options: ['Back it off or change the aim, keeping the body of the tone', 'Ask the player to press the keys more gently through the take', 'Move the mic closer still, so the tone covers the clicks'],
      correct: 'Back it off or change the aim, keeping the body of the tone',
      explain: 'Close to the stacks a mic hears the mechanism. A little more distance, or an aim across the body rather than straight at the keys, usually keeps the tone and drops the clicks.',
      why: {
        'Ask the player to press the keys more gently through the take': 'The keys are part of playing. Change the mic’s distance or aim first.',
        'Move the mic closer still, so the tone covers the clicks': 'Closer hears MORE of the mechanism, not less.',
      },
    },
    {
      id: id('s.harsh'),
      observation: 'The upper notes turn harsh',
      firstChecks: 'Bell axis, overload, or a bright mic? Compare off the bell’s axis and check every gain stage.',
      options: ['Try off the bell’s axis, and check each gain stage for overload', 'Turn the whole channel down until the high notes sound smoother', 'Swap the reed, since harsh high notes come from a worn reed'],
      correct: 'Try off the bell’s axis, and check each gain stage for overload',
      explain: 'Straight down the bell’s axis is the brightest spot; a little off it is often smoother. And overload anywhere in the chain sounds harsh — find where it starts before changing tone.',
      why: {
        'Turn the whole channel down until the high notes sound smoother': 'A fader after the input does not undo overload, and does not change where the mic is. Check the aim and the gain stages.',
        'Swap the reed, since harsh high notes come from a worn reed': 'The reed is the player’s choice. Check the mic’s aim and the gain chain first.',
      },
    },
    {
      id: id('s.move'),
      observation: 'The level and tone change as the player moves',
      firstChecks: 'Stand pickup zone too narrow? Re-aim, back off a little, or try a bell clip made for this horn.',
      options: ['Re-aim or back off, or try a clip made for the bell', 'Ask the player to stay still for the whole of the show', 'Add a compressor so that the changes in level even out'],
      correct: 'Re-aim or back off, or try a clip made for the bell',
      explain: 'A close stand mic has a small working zone; a sway takes the horn out of it. A little distance widens the zone; a bell clip moves with the horn.',
      why: {
        'Ask the player to stay still for the whole of the show': 'Movement is part of the music. Widen the zone, or move the mic with the horn.',
        'Add a compressor so that the changes in level even out': 'A compressor evens the level, not the tone: the balance of holes and bell still changes. Fix the geometry first.',
      },
    },
    {
      id: id('s.fb'),
      observation: 'Feedback, or heavy spill from the stage',
      firstChecks: 'Lower the level, then change the mic, monitor and player geometry, and close mics you do not need.',
      options: ['Lower the level, then change the geometry and open mics', 'Boost the sax channel so the horn is louder than the ring', 'Swap to an omni mic, which is less likely to feed back'],
      correct: 'Lower the level, then change the geometry and open mics',
      explain: 'Feedback is a sound-system condition: reduce the level first, then move the mic or the monitor, and close mics you do not need. Never provoke feedback on purpose.',
      why: {
        'Boost the sax channel so the horn is louder than the ring': 'More gain feeds the loop. Lower the level first.',
        'Swap to an omni mic, which is less likely to feed back': 'An omni rejects nothing: it usually makes feedback more likely, not less.',
      },
    },
    {
      id: id('s.low'),
      observation: 'The lowest notes lose weight after a filter',
      firstChecks: 'Is the filter removing wanted fundamentals? Bypass it and compare on the real lowest phrase.',
      options: ['Bypass the filter and compare on the lowest real phrase', 'Turn the low-frequency EQ up to bring the weight back', 'Ask the player to leave out the lowest notes of the part'],
      correct: 'Bypass the filter and compare on the lowest real phrase',
      explain: 'A high-pass filter set above the horn’s lowest notes removes their weight. Check it bypassed against the actual low line, and set it only for rumble or handling noise.',
      why: {
        'Turn the low-frequency EQ up to bring the weight back': 'EQ after the filter cannot restore what the filter removed. Bypass and compare first.',
        'Ask the player to leave out the lowest notes of the part': 'The part is the music. Set the filter for it, not the other way round.',
      },
    },
  ];

  /* The one-mic procedure (L13–L17). */
  const orderTasks: OrderTask[] = [
    {
      id: id('prac.order'),
      page: 'practice',
      prompt: 'Tap the steps of a one-mic setup in the order you would do them.',
      steps: [
        { text: 'Ask the player how they stand or sit, how they move, and the sound they want', early: 'Start with the player and the horn.' },
        { text: 'Hear the horn unamplified: quiet and loud, low and high', early: 'Hear it once you know what they will play.' },
        { text: 'Choose a mic and mount that suit the horn, the room and the show', early: 'Choose once you have heard how they play and what they want.' },
        { text: 'With the player stopped, place the stand clear of the bell’s swing; route the cable', early: 'You need a chosen mic before you place it.' },
        { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is placed and connected — with the outputs muted first.' },
        { text: 'Set input gain on quiet AND loudest passages, with headroom', early: 'Gain is set once the mic is connected and powered.' },
        { text: 'Compare positions one change at a time, at matched levels', early: 'Compare once the level is set safely — at matched levels, so louder does not win.' },
        { text: 'Keep the simplest position that works, clear of the player', early: 'Decide last, after comparing.' },
      ],
      explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it with headroom for the strongest passages, watching every stage’s overload light — mic, wireless pack, preamp, converter.',
    },
  ];

  const R: Reasons = {
    POWER: { id: 'r.power', label: 'This channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom (a miniature through its adapter); a dynamic needs none.' },
    DOC: { id: 'r.doc', label: 'It is a recommended starting point for this kind of mic, from the part it names', role: 'required', feedback: 'Say why it is a good place to begin, and which part it is measured from.' },
    CLEAR: { id: 'r.clear', label: 'The mic, mount and cable stay clear of the bell’s swing, the hands and the keys', role: 'required', feedback: 'Clearance is part of every passing setup.' },
    BRAND: { id: 'r.brand', label: `It is the brand most engineers reach for on a ${s}`, role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' },
    LOUD: { id: 'r.loud', label: 'It will give the loudest sound of any position on the horn', role: 'wrong', feedback: 'Loudness is not a passing reason — level comes from gain — and no position is “the loudest” on every horn.' },
  };

  const predictions: Lesson['predictions'] = {
    sound: { prompt: 'Before you step through: the player opens more holes from the bell end. Where will most of the note leave the horn?', options: ['At the bell', 'At the first open hole', 'Evenly along the body'], after: 'Now STEP through it (or PLAY ONCE), then walk the scale on the next step.' },
    microphone: { prompt: 'Before you move anything: where will a supercardioid pick up LEAST?', options: ['Straight behind it (180°)', 'Toward the rear, off to one side', 'At its sides (90°)'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
    placement: { prompt: 'Predict: you move the mic from above the bell toward the middle of the key stack. What changes?', options: ['Brighter', 'Warmer, with more key noise', 'It depends on this horn'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
    context: { prompt: 'Where will this supercardioid reject the player’s wedge best?', options: ['Straight behind the mic', 'Toward the rear, off to one side', 'At the sides of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
    twoMic: { prompt: 'If you flip B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then move a mic. Watch which readout each action changes.' },
  };

  /* THE QUICK CHECK: 6 items, two per foundation; q.6 (hearing) is critical. */
  const diagnostic: DiagnosticItem[] = [
    { id: 'q.1', covers: 'instrument', ...c.q1 },
    {
      id: 'q.2',
      covers: 'instrument',
      prompt: 'What does the saxophone’s octave key do?',
      options: ['Opens a small vent so the notes sound an octave higher', 'Closes the bell so that the lowest notes sound louder', 'Locks the keys so the fingers can rest between phrases'],
      correct: 'Opens a small vent so the notes sound an octave higher',
      explain: 'The thumb opens a small vent near the top of the air column, and the same fingerings sound an octave higher — the air column’s second shape.',
      why: {
        'Closes the bell so that the lowest notes sound louder': 'Nothing closes the bell. The octave key opens a small vent and sends the notes up an octave.',
        'Locks the keys so the fingers can rest between phrases': 'No key locks the others. The octave key opens a vent that sends the notes up an octave.',
      },
    },
    {
      id: 'q.3',
      covers: 'sound',
      prompt: 'For a note with several holes open, where does the air column end?',
      options: ['At the first open hole, the one nearest the reed', 'At the bell rim, whatever the fingering happens to be', 'At the last open hole, the one closest to the bell rim'],
      correct: 'At the first open hole, the one nearest the reed',
      explain: 'The first open hole — the open hole nearest the mouthpiece — acts as though the tube were sawn off there (in practice a little beyond it). The notes rise as it moves up.',
      why: {
        'At the bell rim, whatever the fingering happens to be': 'Only with every key closed does the air column run to the bell.',
        'At the last open hole, the one closest to the bell rim': 'The holes past the first open one hardly change the note: the first open hole sets the length.',
      },
    },
    {
      id: 'q.4',
      covers: 'sound',
      prompt: 'Every key is closed for the lowest note. Where does it leave the horn?',
      options: ['Through the bell, the only open end', 'Through the octave vent near the top', 'Evenly through all the closed holes'],
      correct: 'Through the bell, the only open end',
      explain: 'With every key closed the air column runs the whole length, and the lowest note leaves through the bell.',
      why: {
        'Through the octave vent near the top': 'The octave vent is closed for the lowest note — it opens only for the second register.',
        'Evenly through all the closed holes': 'A closed hole is sealed by its pad; nothing leaves there.',
      },
    },
    {
      id: 'q.5',
      covers: 'setting',
      prompt: 'Where should the cable for a stand mic in front of a saxophonist run?',
      options: ['Away from the player’s feet and the path to their seat', 'Along the floor under the bell, where it is out of sight', 'Up the player’s strap, so it moves along with the horn'],
      correct: 'Away from the player’s feet and the path to their seat',
      explain: 'Route and secure cables away from the player’s feet and walking path, and keep the stand out of the bell’s swing.',
      why: {
        'Along the floor under the bell, where it is out of sight': 'Under the bell is where the horn swings and the player steps. Route it away.',
        'Up the player’s strap, so it moves along with the horn': 'A stand mic’s cable stays with the stand. Only a clip’s cable rides the horn — with strain relief, agreed with the player.',
      },
    },
    {
      id: 'q.6',
      covers: 'setting',
      critical: true,
      prompt: `Your ${s} mic is rated to a very high maximum SPL. What does that tell you about a long, loud soundcheck?`,
      options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe for a while, as long as the stage stays below the rating', 'It is safe as long as the mic is nearer the bell than you are'],
      correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
      explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
      why: {
        'It is safe for a while, as long as the stage stays below the rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
        'It is safe as long as the mic is nearer the bell than you are': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
      },
    },
  ];

  const settingItems: SettingItem[] = [
    { id: 'sax', label: `the ${s} and its player`, short: S.toUpperCase(), note: c.F.row.id === 'soprano' ? 'Held in front, the straight horn pointing down and forward, the bell about level with the player’s hips. Ringed in amber: the instrument this lesson mics.' : `On a strap round the player’s neck, the body angled across to the player’s right, the bell beside the right ${c.F.row.id === 'baritone' ? 'hip' : 'thigh'}. Ringed in amber: the instrument this lesson mics.`, prov: { kind: 'illustrative', reason: 'alto_sax/GEOMETRY_PROPOSAL.md §2 player pose (drawing defaults)' }, tag: 'THE INSTRUMENT', scene: 'all' },
    { id: 'swing', label: 'the bell’s swing', short: 'BELL SWING', note: `As the player sways and turns, the horn moves with them — the bell by a hand’s width or more${c.F.row.id === 'baritone' ? ', and a baritone is big and heavy' : ''}. A stand’s base or tube in that space will be struck. The grey hatch shows roughly where it goes.`, prov: { kind: 'illustrative', reason: `the swing ±${c.F.row.swing}° (proposal §5 drawing default)` }, tag: 'KEEP CLEAR', scene: 'kit' },
    { id: 'hands', label: 'the hands on the keys', short: 'HANDS · KEYS', note: 'Both hands work the keys all the time — the left on the upper stack, the right on the lower, the right thumb under its rest. A clip, a gooseneck or a cable must stay out of their way, and nothing clamps to a key or a rod.', prov: { kind: 'illustrative', reason: 'proposal §5 hand boxes' }, tag: 'KEEP CLEAR', scene: 'kit' },
    { id: 'stand', label: 'the music stand', short: 'MUSIC STAND', note: 'In front of the player. They must see the music and the band leader: a mic stand should not block that line.', prov: { kind: 'illustrative', reason: 'a typical layout' }, tag: 'SIGHT LINE', scene: 'kit' },
    ...c.neighbours,
    { id: 'kit', label: 'the rhythm section’s drums', short: 'DRUMS', note: 'Behind the horns: loud, and heard by every horn mic. A close, aimed mic hears less of the drums than one farther off.', prov: { kind: 'illustrative', reason: 'Lab 1’s shared kit, a typical band layout' }, tag: 'SPILL', scene: 'kit' },
    { id: 'wedge', label: 'the player’s wedge (monitor)', short: 'WEDGE', note: 'On a stage, a floor monitor in front, facing back at the player — loud, and close to the horn’s mic. Studio or live shows how a pattern’s rejection can face it.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
    { id: 'side', label: 'another player’s wedge', short: 'SIDE WEDGE', note: 'Off to one side, facing another player. Loud enough to reach the horn’s mic from the side.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
    { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Live, the audience already hears the acoustic horn; the PA adds what the room needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
    { id: 'main', label: 'a main pair over the section', short: 'MAIN PAIR', note: `In a recording of a band, a main pair hears the whole section; a ${s} mic is a spot that supports it — raise it only for definition or balance.`, prov: { kind: 'illustrative', reason: 'a generic main pair' }, tag: 'MAIN PAIR', scene: 'studio' },
    { id: 'room', label: 'the room', short: 'THE ROOM', note: 'No wedges on the floor; a good room is part of a saxophone’s sound. A little more distance — or a room mic — lets it in.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
  ];

  const copy: Partial<LessonCopy> = {
    variantKey: 'POSTURE',
    variantShort: { standing: 'standing', seated: 'seated' },
    sceneSubject: { standing: `a ${name} played by a standing player`, seated: `a ${name} played by a seated player` },
    viewTag: { side: 'SIDE · FROM THE PLAYER’S RIGHT', top: 'TOP · FROM ABOVE' },
    axes: {
      x: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (x). Distances are read from the part the starting point names — the bell, the tone holes.' },
      y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y).' },
      z: { plus: 'to player’s right', minus: 'to player’s left', label: 'ACROSS', blurb: 'Toward the player’s left or right (z) — the horn hangs to the right.' },
    },
    instrument: {
      figureBadge: `The ${s} face-on · every part named`,
      figureLabel: `The ${name} seen face-on.`,
      partsBadge: `The ${s} and its player · tap a part to name it`,
      partsLooking: { side: 'Side view · from the player’s right', top: 'Top view · from above' },
      partsIdle: `The reed sets the air vibrating; the keys open the tone holes along the body; the bell ${c.F.row.id === 'soprano' ? 'points down and forward' : 'curves up beside the body'}. The next page shows where the sound leaves. The player holds it ${c.F.row.id === 'soprano' ? 'in front' : 'on a strap'} and moves with the music.`,
      variantNotes: { seated: 'SEATED: the same hold — the horn stays where it was; the floor, the knees and the chair come closer to a stand’s base. Switch POSTURE to stand the player up.' },
    },
    placement: {
      workedZone: { standing: c.use.worked, seated: c.use.worked },
      workedLine: 'This starting point also reads how far the mic is from {line}: the dashed line out of the bell.',
      workedAim: c.workedAim ?? 'Aim it down across the body at the sound holes — the lab counts it while the mic’s axis points into the key stack near its middle. Distance, height and angle are separate things to try.',
      workedClear: 'Clear of every part — the bell and the keywork, the hands on the keys, the player, and the space the bell swings through. Clearance comes first, before any number, and the player stops before a real mic moves.',
      blocked: {},
      reveal: c.placementReveal,
      typeNotes: c.typeNotes,
      note: 'Clearance comes first: stop the player before moving a real mic. A mic, clip or cable anywhere the hands, the keys or the bell’s swing can reach is in the wrong place, whatever the number says.',
      availableLead: 'Starting points for this mic',
      learn: {
        intro: c.learnIntro,
        separate: 'Distance, height and the angle between the bell and the body are separate variables: change one at a time, and play low and high notes, quiet and loud, each time. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille, so no millimetre claim is made.',
        clearance: 'Clearance comes first. Stop the player before moving a mic; keep the mic, stand, clip and cable out of the bell’s swing, the hands and the keys. The grey hatch appears when a mic comes near the space the bell sweeps — leave more room on a real stage.',
        tendencies: 'Toward the bell tends to bring brightness and focus; toward the tone holes, warmth and fullness with more key noise; farther away, more of the whole horn and the room. A directional mic up close also lifts the lows (proximity effect). These are tendencies, and horns and players vary.',
      },
    },
    context: {
      variant: 'standing',
      zone: c.use.live,
      typeId: 'instDynCard',
      patterns: [
        { id: 'cardioid', label: 'cardioid', typeId: 'instDynCard' },
        { id: 'supercardioid', label: 'supercardioid', typeId: 'saxDynSuper' },
      ],
      micNoun: 'A compact dynamic',
      shield: ['sx.bell', 'sx.body'],
      azMax: 60,
      elMax: 45,
      aimBlurb: 'Swing the front up to 60° either way — it still faces the horn.',
      plan: c.contextBoxes.plan,
      side: c.contextBoxes.side,
      target: 'wedge',
      frontIds: [],
      targetWord: 'wedge',
      looking: 'Top view · the mic above the bell, the wedge in front',
      prompt: 'The player’s wedge stays where they need it. Turn the MIC (AIM) or change its PATTERN until the wedge sits in the rejection — while the mic still points at the horn.',
      activityDone: 'done — the wedge sat in a null by your aim or pattern',
      deepNull: 'On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.',
      cardioidReveal: c.cardioidReveal ?? 'What you just saw: a cardioid rejects most directly behind (180°). Above the bell and aimed down at the body, its rear looks up and forward — the wedge, down on the floor, sits below that line, so tilting the mic matters as much as turning it.',
      shieldNote: 'The bell and the body REFLECT stage sound back toward a mic close to them — the free-field pattern cannot show that. Listen with the monitors on.',
      studioId: id('ctx.studio'),
      studioPrompt: `A studio session, a solo ${s}, a good room: what is the mic’s job?`,
      studioNote: 'In the studio, a mic a little farther off can carry the whole horn and some of the room; a closer one adds definition when the arrangement needs it. Repeated trials are practical when the player stops. Switch back to LIVE for the monitor exercise.',
      learn: {
        intro: 'These are scenario-based comparisons, not restrictions.',
        points: [
          { title: 'PERSPECTIVE', text: 'Studio: a good room and a little distance let the holes and the bell blend. Live: beside drums and amps, a closer, aimed mic — or a bell clip — keeps the horn separate.' },
          { title: 'SPILL AND FEEDBACK', text: 'Studio: the room and the section. Live: monitors, the PA and the band. A closer mic, the right pattern and aim help — and the bell still reflects some stage sound into a mic close to it.' },
          { title: 'MOVEMENT', text: 'Players move with the music. A stand mic has a working zone — mark it, and keep its base out of the bell’s swing; a clip on the bell rim keeps one distance as the player moves.' },
          { title: 'IN A SECTION', text: `With a main pair or section mics up, a ${s} mic is a spot: raise it only for a stated balance, and check it in mono so it does not pull the player forward.` },
        ],
        body: 'With a wedge in front of the player, a pattern’s rejection is a tool to aim — tilting as well as turning. Some stage sound in a horn mic is normal; the question is how much the music can take.',
        warn: 'No mic position alone prevents feedback: the pattern, the other open mics, the monitors, the system level and the room all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.',
      },
    },
    twoMic: {
      variant: 'standing',
      A: { typeId: 'instDynCard', pattern: 'cardioid', zone: c.use.twoA },
      B: { typeId: c.use.twoBType, pattern: 'cardioid', zone: c.use.twoB },
      learn: [
        'A second mic — a room mic, or a farther stand mic beside a close one or a clip — is a choice for a reason, not a requirement. Hear each mic alone first: each should work on its own.',
        'When the pair goes in: hear it in MONO at the intended levels. Move or rebalance a mic first; check both polarity states at matched levels only after that — a polarity switch cannot line up every pitch.',
      ],
      warn: 'This simplified graph treats the horn as one point and both mics as hearing the same sound. Real mics at different distances hear different mixes of holes, bell and room, so read the notch POSITIONS (they follow from the arrival-time difference) and treat their depths as illustrative. Judge by ear, in mono, at matched levels.',
    },
    practice: {
      gain: id('prac.gain'),
      second: id('prac.3'),
      mixed: [id('mix.1'), id('mix.2'), id('mix.3')],
      mixedIntro: 'Three cards from earlier pages, mixed: what a distance is measured from, a pattern’s null, and polarity versus delay.',
    },
    terms: {
      instrument: `the ${s}`,
      aimRef: 'its reference',
      startIntro: `This lesson is about putting a microphone on a ${name}. First the horn itself: what it is, how the reed and the air column make its sound and where that sound leaves, and where the player stands or sits. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.`,
      startNew: `Good — NEXT takes you through the ${s} first. You can change how you started here at any time.`,
      refTitle: 'MEASURED FROM',
      otherRef: 'The same number measured from another part — the tone holes, the body, a third of the way up — would put the mic somewhere else.',
      noAim: 'This starting point gives no aim, so the mic simply faces the horn. Distance, height and angle are still separate things to try.',
      clipMount: 'Mount: a clip made for this bell, on the rim only — with the player’s agreement',
      standMount: 'Mount: a stand placed clear of the bell’s swing, the hands and the player',
      inPath: 'horn in path',
      facing: 'facing the horn',
      observation: 'For a real saxophone, with the player’s agreement, and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
    },
  };

  return {
    id: c.id,
    labId: 'winds',
    title: c.title,
    subtitle: c.subtitle,
    noun: { one: s, many: `${s}s` },
    model: c.F.MODEL,
    micTypeIds: ['instDynCard', 'saxDynSuper', 'roomLdc', 'saxClip'],
    zones: c.zones,
    pages,
    scenarios,
    symptoms,
    orderTasks,
    setupTasks: c.setup(R),
    predictions,
    orient: c.orient,
    sound: {
      stages: [
        { title: 'The reed opens and closes', text: 'The player’s breath and lips set the cane reed vibrating against the mouthpiece: it lets puffs of air into the horn, many times a second, at the note’s pitch.' },
        { title: 'A pressure pulse runs down the cone', text: 'Each puff sends a pressure pulse down the conical tube — drawn here as one bright spot, far slower than it really travels.' },
        { title: 'The first open hole ends the air column', text: 'At the first open tone hole the pulse meets the room’s air and turns back: the air column acts as if the tube ended there — a little beyond it, in practice. Its length sets the note.' },
        { title: 'Sound leaves', text: 'Most of the note leaves through the first open hole and the open holes just past it; the bell carries its high harmonics. The tube beyond the first open hole hardly takes part.' },
      ],
      attack: 'The start of a note: the player’s tongue releasing the reed and the reed beginning to vibrate. Breath and reed noise come from the mouthpiece, by the player’s mouth — a mic close to the mouthpiece hears more breath than horn.',
      body: 'The sustained tone: the air column ringing, leaving mostly through the open holes near the first open one and — for the lowest notes and the high harmonics — the bell. Where it leaves moves with every note, so a close mic hears a changing picture, and a little distance blends it. Tendencies; horns and players vary.',
      head: { diameterMm: 0, rods: 0, label: `the ${s}’s air column`, strikeSrc: 'UNSW-SAX' },
    },
    setting: { items: settingItems, stage: c.stage, studio: c.studio },
    diagnostic,
    practice: {
      task: `Choose a one-mic ${s} setup for a studio and for a live show, describe an alternative position, and explain what would justify a second mic. With a real horn and the player’s agreement, you can record what you tried below.`,
      fields: [
        { id: 'room', label: 'Room or stage', kind: 'text' },
        { id: 'posture', label: 'Player', kind: 'choice', choices: ['standing', 'seated'] },
        { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['instrument dynamic, cardioid', 'instrument dynamic, supercardioid', 'large condenser', 'bell clip', 'other'] },
        { id: 'zone', label: 'Starting position you tried', kind: 'text' },
        { id: 'distance', label: 'Distance, from which part (bell, holes …)', kind: 'text' },
        { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
      ],
    },
    unknowns: [
      { text: 'The horn’s height above the floor (the lips about 1.56 m up standing, 1.17 m seated), its hold — turned, rolled, the reed angle — and the player’s whole body: drawing defaults, so no HEIGHT readout is shown.', dims: ['yFloor'] },
      { text: 'Every saxophone dimension — the path of the neck, body, bow and bell, the bell rim, the tone holes’ positions and sizes, the key cups, rods and guards — is a drawing default: makers print none. The holes follow the semitone rule fitted to the drawn body (simplified).', dims: [] },
      { text: '“A few inches” (above the bell, into the bell, from the holes) has no number: drawn 5–10 cm. The clip’s reach, the bell’s swing and the over-the-shoulder distance are drawing defaults.', dims: [] },
      { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front and rounds to ≈ 5 mm.', dims: [] },
      ...(c.unknowns ?? []),
    ],
    live: { wedges: c.wedges },
    accuracyDetail: `ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every saxophone, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one player in a typical hold, a simplified fingering and tone-hole layout, the bell’s swing as a hatched area that appears when a mic comes near, mic patterns and the two-mic comb as textbook shapes. ${c.accuracyExtra} Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the player stopped, and only with their agreement.`,
    copy,
  };
}

/** The family's wedges at a stage position (ILLUSTRATIVE: no source gives
 *  them): the player's own in front, facing back; another to the side. */
export function saxWedges(floorY: number, front: number, across: number): Wedge[] {
  return [
    {
      id: 'wedge',
      label: 'the player’s own wedge, on the floor in front, facing back at them',
      short: 'WEDGE',
      p: { x: front, y: floorY, z: across },
      lift: 150,
      faces: { x: -1, y: 0, z: -0.12 },
      note: 'It sits in front of the player, below and ahead of a mic above the bell — the case a pattern’s null can help with, once the mic is tilted as well as turned.',
      prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
    },
    {
      id: 'side',
      label: 'another player’s wedge, off to the side',
      short: 'SIDE WEDGE',
      p: { x: 250, y: floorY, z: across + 1250 },
      lift: 150,
      faces: { x: -0.3, y: 0, z: -1 },
      note: 'Off to the side, facing another player: it reaches the horn’s mic from the side.',
      prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
    },
  ];
}

/** The setup briefs every saxophone shares, with the horn's own words. */
export function saxSetupTasks(pfx: string, s: string, R: Reasons): SetupTask[] {
  return [
    {
      id: `${pfx}.prac.setup1`,
      page: 'practice',
      brief: `BRIEF 1 · A loud club. The ${s} player steps forward for solos and moves with the music. One channel; phantom power is available.`,
      setups: [
        { id: 'a', label: 'A bell clip made for this horn, the capsule angled between the bell and the keys', ok: true, power: 'phantom', feedback: 'It moves with the horn, so the level holds as the player moves; it needs the phantom power this channel has.' },
        { id: 'b', label: 'A supercardioid dynamic a few centimetres above the bell, aimed at the holes, the wedge in its rejection', ok: true, power: 'none', feedback: 'A recommended starting point, close and directional for a loud stage — the player will need to stay near it.' },
        { id: 'c', label: 'A cardioid dynamic a few centimetres from the bell, aimed into it, for a bright, separate lead', ok: true, power: 'none', feedback: 'A recommended starting point with a brighter, more isolated tendency — fine if the stand is clear of the bell’s swing.' },
        { id: 'd', label: 'A clip squeezed onto a key rod, the capsule tucked in over the pads', ok: false, power: 'phantom', feedback: 'Nothing clamps to a rod or a key: it can bend the mechanism or stop a key closing. Clips go on the bell rim only.' },
        { id: 'e', label: 'A stand right under the bell, so the mic can sit inside it', ok: false, power: 'none', feedback: 'The stand would stand in the bell’s swing, and a mic inside the bell can be struck. Keep both clear.' },
      ],
      reasons: [R.DOC, R.CLEAR, R.POWER, { id: 'r.move', label: 'It keeps a steady sound as the player moves on a loud stage', role: 'optional', feedback: 'A fair live reason.' }, R.BRAND, R.LOUD],
      explain: 'More than one setup passes this brief. What passes is the reasoning: a sensible starting point from its named part, clearance from the bell’s swing and the hands, and power that matches the mic.',
    },
    {
      id: `${pfx}.prac.setup2`,
      page: 'practice',
      brief: `BRIEF 2 · Studio, a good room, a solo ${s} ballad. The only spare input has NO phantom power.`,
      setups: [
        { id: 'a', label: 'A cardioid dynamic a few centimetres above the bell, aimed at the sound holes', ok: true, power: 'none', feedback: 'A recommended starting point for a natural tone — and a dynamic needs no phantom.' },
        { id: 'b', label: 'A cardioid dynamic a few centimetres from the sound holes, for a warmer, fuller tone', ok: true, power: 'none', feedback: 'A recommended starting point with a warmer tendency — listen for key noise; a dynamic needs no phantom.' },
        { id: 'c', label: 'A large condenser 50 cm in front, aimed between the bell and the keys', ok: false, power: 'phantom', feedback: 'A fine place to begin in a good room — but this input has no phantom power, and a condenser needs it.' },
        { id: 'd', label: 'A bell clip angled between the bell and the keys', ok: false, power: 'phantom', feedback: 'The miniature is a condenser: it needs phantom power through its adapter, and this input has none.' },
        { id: 'e', label: 'A dynamic pushed right into the bell for the most level', ok: false, power: 'none', feedback: 'Inside the bell the mic can be struck, and it hears only part of the horn. Level comes from gain.' },
      ],
      reasons: [R.DOC, R.CLEAR, R.POWER, { id: 'r.room', label: 'In a good room the tone holes and the bell can blend', role: 'optional', feedback: 'A fair studio reason.' }, R.BRAND, R.LOUD],
      explain: 'Two dynamic positions pass. What passes is the reasoning: a sensible starting point, clear, and powered by what this input can supply.',
    },
  ];
}
