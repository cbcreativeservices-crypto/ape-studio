/**
 * Miking Labs — "this screen, explained" (Screen Guide rollout, owner
 * 2026-10-31; the pattern and the content standard are the Wave Physics pilot,
 * wave/waveScreenGuides.ts).
 *
 * WHY THIS FILE BUILDS ITS GUIDES INSTEAD OF LISTING THEM. The seven Miking
 * family tiles open ONE hub screen (MikingHubScreen) and 128 lessons served by
 * ONE lesson screen (MikingLessonScreen): eight modules each, every module a
 * run of steps, and most lessons draw some modules with their own page code.
 * A fixed guide per screen would be ~1,000 hand-written guides that could not
 * stay true. So a guide is put together, for the step on screen, from three
 * kinds of words — each one true by construction:
 *
 *   1. what the screen itself is drawing NOW: the module's title and goal,
 *      the step's strip label, the bezel readout keys and the dock keys (with
 *      their menu choices), reported by the step engine (engine/steps.tsx
 *      → stepInfoOf);
 *   2. hand-written lines for the SHARED steps the engine draws for every
 *      lesson (STEP_NOTES, keyed by the step's kind + title, each line checked
 *      against that step's code — test/screenGuide_miking_20261031.test.ts
 *      pins every name it quotes to the source);
 *   3. hand-written lines for each journey STAGE (docs/labs/miking/
 *      LESSON_JOURNEY.md), worded so they hold for an instrument, a voice, a
 *      venue or a measurement — with the sharper physics lines kept for the
 *      modules that carry the engine's default title ("Studio or live",
 *      "Two microphones"); the microphones module adds a pointer to
 *      Microphone Principles instead.
 *
 * Plus three fixed guides: the family hub, the Foundations card (shown in
 * place of a module's activity until the first two modules are met) and the
 * lesson's what's-left screen.
 *
 * STEPPED: each section must fit a 375×812 phone with no scrolling, so the
 * builder holds every section to SCREEN_GUIDE_BUDGET (types.ts): optional
 * lines drop first, then the dock list shortens. Copy rules: plain words;
 * KNOWLEDGE, never skills; "suggest", never "recommend"; Miking words are
 * suggested starting points, not rules; no gear maker or model names; no
 * "N of total"; no build notes in learner text; no numbers in TRY THIS (a
 * number would have to be what every lesson's screen prints).
 */
import type { ScreenGuide, ScreenIntro } from '../../../features/lab/screenGuide/types';
import { SCREEN_GUIDE_BUDGET } from '../../../features/lab/screenGuide/types.ts';
import type { PageId } from './engine/model/types.ts';
import { SETUPS_STEP_NAME, SETUPS_TITLES, stageOf } from './engine/journey.ts';

// ═══ WHAT THE STEP ENGINE REPORTS ════════════════════════════════════════

export type MikingDockKind = 'fader' | 'options' | 'group' | 'toggle' | 'action';
/** One dock key as drawn: its label, its kind and its menu's choices (an
 *  options key's list, or a slider's chooser menu). */
export type MikingDockKey = { label: string; kind: MikingDockKind; options: readonly string[] };
/** The step on screen, in its on-screen words. */
export type MikingStepInfo = {
  kind: string;
  title: string;
  /** The strip / contents label (PageSteps' own rule). */
  label: string;
  layout: 'rack' | 'read';
  /** Bezel readout keys, left to right (the lit-cell ▸ removed). */
  bezel: readonly string[];
  dock: readonly MikingDockKey[];
};

type DockLike = { kind: string; label: string; options?: readonly { label: string }[]; chooser?: { options: readonly { label: string }[] } };
type StepLike = { kind: string; title: string; layout: 'rack' | 'read'; rack?: { bezel: readonly { k: string }[]; params: readonly DockLike[] } };

/** The label the strip and the contents show for a step (PageSteps: the
 *  title alone when it IS the kind, else "KIND · title"). */
export function stripLabel(kind: string, title: string): string {
  return kind === title.toUpperCase() ? title : `${kind} · ${title}`;
}

const DOCK_KINDS: readonly MikingDockKind[] = ['fader', 'options', 'group', 'toggle', 'action'];

/** A step's on-screen description — pure, so the engine can report it and
 *  the test can build it from a page's own step data. */
export function stepInfoOf(s: StepLike): MikingStepInfo {
  const rack = s.layout === 'rack' ? s.rack : undefined;
  return {
    kind: s.kind,
    title: s.title,
    label: stripLabel(s.kind, s.title),
    layout: s.layout,
    bezel: rack ? rack.bezel.map((b) => b.k.replace(/^▸\s*/, '')) : [],
    dock: rack
      ? rack.params
          .filter((p) => (DOCK_KINDS as readonly string[]).includes(p.kind))
          .map((p) => ({ label: p.label, kind: p.kind as MikingDockKind, options: (p.options ?? p.chooser?.options ?? []).map((o) => o.label) }))
      : [],
  };
}

/** A stable key: the step reports again only when what it shows changes. */
export function stepInfoKey(i: MikingStepInfo | null): string {
  return i ? JSON.stringify(i) : '';
}

// ═══ SHARED STEPS (engine pages every lesson can show) ═══════════════════

type Words = string | ((s: MikingStepInfo) => string);
type StepNote = {
  /** Only when the module is drawn by the engine's OWN page (not a lesson
   *  family's page that reuses the step title with other controls). */
  engineOnly?: boolean;
  /** The intro card for this step (Guided Lessons return 2026-11-08). */
  intro?: ScreenIntro;
  seeing?: Words;
  control?: Words;
  changes?: Words;
  tryThis: readonly Words[];
};

const has = (s: MikingStepInfo, label: string) => s.dock.some((k) => k.label === label);
/** The menu choices a dock key shows right now (none when the key is absent). */
const optsOf = (s: MikingStepInfo, label: string): readonly string[] => s.dock.find((k) => k.label === label)?.options ?? [];
/** A plain cardioid choice (not super-, hyper- or half-cardioid). */
const isCardioid = (o: string) => /^cardioid\b/i.test(o.trim());
/** A pattern choice with no null to aim (omni). */
const isOmni = (o: string) => /omni/i.test(o);

/** Keyed `${kind}|${title}` — the shared pages' own step kind and title.
 *  A note without `engineOnly` is for a step whose every copy in the Miking
 *  code draws the same thing (the test pins the copies); an `engineOnly`
 *  note applies only on the engine's own page for that module. */
export const STEP_NOTES: Readonly<Record<string, StepNote>> = {
  // MEET IT (pages/PInstrument.tsx; the same START in every family's page)
  'READ|Start here': {
    intro: {
      learning: 'Every miking lesson follows one journey, from where the sound leaves to a mic placed and checked; the map shows that order before you begin.',
      start: 'Look over THE JOURNEY map. Then choose New to miking … to go in order, or I already mic … to take the six-question quick check.',
    },
    seeing: 'THE JOURNEY map lists every stage of this lesson in order. Below it, “How would you like to start?” offers you two paths.',
    control: 'Tap New to miking … to work through the lesson in order, or I already mic … to take the six-question quick check, right here on this step.',
    changes: 'Your path only changes what is suggested next. Passing the quick check opens every activity now, but it finishes nothing: you still complete the first two modules yourself.',
    tryThis: [
      'Choose New to miking …, then use NEXT › to walk through the lesson in order. You can come back here and change your choice at any time.',
      'Choose I already mic … and read the QUICK CHECK line before answering: your first try is the one that counts.',
    ],
  },
  'LEARN|What it is': {
    // "what you are miking": some lessons' subject is a site or a scene (F10, F12), not an instrument.
    intro: {
      learning: 'What you are miking and where its sound comes from, before any microphone comes near it.',
      start: 'Start with the drawing, then read each card and find on the drawing the part it names.',
    },
    seeing: 'Here you meet what you are miking: a drawing and short fact cards, one idea per card, before any mic appears.',
    tryThis: ['Read each card’s title, then find what it names on the drawing.'],
  },
  'TRY|The parts': {
    engineOnly: true,
    intro: {
      learning: 'Which parts of the source make the sound and where the sound leaves them: those places are where a mic hears it most directly.',
      start: 'Tap a part on the drawing, or step through PART in the dock. On each card, look for the WHERE SOUND COMES FROM line.',
    },
    seeing: 'The part you pick lights up on the drawing. Its card says what that part does and, where it applies, WHERE SOUND COMES FROM.',
    control: 'Tap any part on the drawing, or step through PART in the dock. There’s nothing to answer here: just explore.',
    changes: 'Each part’s card names the places its sound leaves from. Those are the places a mic can hear it best.',
    tryThis: [
      'Tap the part the sound leaves from and read its WHERE SOUND COMES FROM line.',
      'Step through every part with PART and watch the readouts name each one as you reach it.',
    ],
  },
  // STARTING SETUPS (pages/PSetups.tsx)
  'WATCH|Starting setups': {
    engineOnly: true,
    intro: {
      learning: 'How a real miking setup is described: the mic type and pattern, its distance and aim, and what it tends to do to the sound.',
      start: 'Pick each setup in SETUPS, or step through SETUP when it’s there. For each one, read the START line and what it TENDS TO do.',
    },
    seeing: 'One real setup at a time, drawn where the mic goes: the mic and its mount, where it points (amber, dashed) and its distance (white).',
    control: (s) => `${has(s, 'SETUP') ? 'Step through SETUP, or pick one by name in SETUPS' : 'Pick each setup by name in SETUPS'}. The mics are placed for you here, so there’s nothing to drag.`,
    changes: 'Each card gives the mic type and pattern, a START line (distance and aim) and what it TENDS TO do. Read it as a suggested starting point, not a rule.',
    tryThis: [
      (s) => `Go through every setup${has(s, 'SETUP') ? ' with SETUP' : ' in SETUPS'} and compare them: looking at the main setups is part of finishing this module.`,
      'End on the setup you’d try first: the Placement Studio starts from the last one you look at.',
    ],
  },
  'LEARN|What else the mic hears': {
    // "can bring": the ON A STAGE (LIVE) note is each lesson's own, and not
    // every family's stage holds loud sources (return question 2026-11-08).
    intro: {
      learning: 'A mic hears more than its source: neighbors and the room reach it too, and a stage can bring loud sources close that a studio keeps away.',
      start: 'Read what reaches the mic besides the source. Then compare the ON A STAGE (LIVE) and IN A STUDIO notes.',
    },
    seeing: 'Here you see what else reaches the mic besides the source, what the mic and its stand keep clear of, and what changes ON A STAGE (LIVE) or IN A STUDIO.',
    tryThis: [
      'Pick one neighbor named here and decide which way the mic’s quiet side would face to hear less of it.',
      'Go back one step to the setups and compare two: what does each one gain, and what does it give up?',
    ],
  },
  // MICROPHONES (pages/PMicOnIt.tsx — every lesson; pages/PMicrophone.tsx and
  // shared/journeyPages.tsx draw the same two steps)
  'LEARN|On the instrument': {
    intro: {
      learning: 'A mic’s type decides where it starts on the source, how it is held, what power it needs and which pickup patterns it offers.',
      start: 'Choose a TYPE and watch the drawing move the mic to where that type starts. Then read POWER and MOUNT, and see which choices PATTERN offers.',
    },
    seeing: 'The chosen mic type drawn where this lesson starts it: its mount, its pickup shape (dashed lobe) and its distance (white).',
    control: 'Choose a TYPE: the drawing moves the mic to where this lesson starts it. PATTERN lists only that type’s patterns.',
    changes: 'POWER shows what each type needs: PHANTOM (sent from the desk), NONE (a dynamic or passive ribbon), BATTERY or OWN SUPPLY (a meter or measurement mic), or VARIES (more than one way: the card says which).',
    tryThis: [
      (s) =>
        optsOf(s, 'TYPE').length >= 2
          ? 'Try each TYPE in turn: the drawing moves the mic to where that type starts, and MOUNT says how it is held.'
          : 'Read the card under the drawing, then find on the drawing the mount that MOUNT names.',
      (s) =>
        optsOf(s, 'PATTERN').length >= 2
          ? 'Switch PATTERN: the dashed lobe changes shape while the mic stays where this lesson starts it.'
          : 'Compare the dashed lobe with PATTERN: the lobe is that pattern’s shape, simplified, not how far the mic hears.',
    ],
  },
  'COMPARE|Patterns': {
    intro: {
      learning: 'How a pickup pattern hears less from some directions than others, and where its null sits: the direction it rejects most.',
      start: 'Make your prediction, then sweep SOURCE ANGLE slowly from the front (0°) to directly behind (180°). Watch PICKUP and the NULL readout.',
    },
    seeing: 'A pickup pattern seen from above, with a test source you move around it. Real mics change shape with pitch; this drawing keeps one shape at every pitch.',
    control: 'SOURCE ANGLE swings the test source from the mic’s front (0°) around to directly behind (180°). TYPE and PATTERN change the mic.',
    changes: 'PICKUP is the pattern’s level at that angle against straight ahead. Where the pattern hears nothing, a null appears (DEEP NULL): sound from there cancels at the capsule, the part that turns sound into signal. Real mics still hear a little there.',
    tryThis: [
      'Make the prediction, then sweep SOURCE ANGLE slowly, front to back: the NULL readout shows where this pattern rejects most.',
      (s) =>
        optsOf(s, 'PATTERN').some(isCardioid)
          ? 'With a cardioid PATTERN, set SOURCE ANGLE all the way around: PICKUP reads DEEP NULL, directly behind.'
          : 'Set SOURCE ANGLE all the way around, directly behind: PICKUP shows how much this pattern hears from the back.',
    ],
  },
  'LEARN|By property, not brand': {
    intro: {
      learning: 'Why mics are chosen by property — pattern, power, size and mount — rather than by brand name.',
      start: 'Read one card per mic type. Then tap SPEC DETAILS ▾ on two cards and compare the power each needs and its size.',
    },
    seeing: 'One card per mic type this lesson uses: what it is, the power it needs, how it mounts and its pattern — no brands.',
    control: 'Tap SPEC DETAILS ▾ on a card for its full power line and its size.',
    tryThis: ['Open SPEC DETAILS ▾ on two cards. What power does each one really need, and which one mounts the way this job needs?'],
  },
  // PLACEMENT STUDIO (pages/PPlacement.tsx)
  'WATCH|Worked example': {
    engineOnly: true,
    intro: {
      learning: 'How a suggested starting point is read: where to begin, the distance from a named surface, the aim, and the clearance that comes first.',
      start: 'Use STEP to read the example piece by piece, from WHERE TO BEGIN to CLEARANCE. Watch the lit readout (▸) and the part the drawing marks.',
    },
    seeing: 'A worked example: the mic is placed for you at one suggested starting point (blue). The lit readout (▸) is the piece you’re reading.',
    control: 'Use STEP to read the example piece by piece, from WHERE TO BEGIN to CLEARANCE. The drawing marks the part each piece is about.',
    changes: 'Each distance runs from a named surface to the mic’s FRONT. The same number measured from another surface would put the mic somewhere else.',
    tryThis: [
      'Step to THE DISTANCE: the lit readout reads inside the suggested range written in the card.',
      'Step to CLEARANCE and read why clearance comes before any sound.',
    ],
  },
  'PLACE|Place the mic': {
    engineOnly: true,
    intro: {
      learning: 'How distance, height and aim each change what a mic hears, and why the blue zones are places to start, not fixed answers.',
      start: 'Open ZONE and pick a suggested starting point, then try another. From a zone, change only POSITION or only AIM, and read what the words say changes.',
    },
    seeing: (s) => `This is your mic${has(s, 'START') ? ', starting from the setup in START' : ''}. Blue areas are suggested starting points; keep-clear areas appear as the mic comes near them.`,
    // The middle row's heading is each lesson's own (C.variantKey), so it is not quoted.
    control: 'ZONE jumps the mic to a suggested starting point. SETUP opens MIC TYPE, a row of versions of the source (under its own heading) and MEASURE FROM.',
    changes: 'Inside a blue zone, its card says what that spot tends to do to the sound. Outside, the words list the zones in reach. A part in the way stops the mic where it would touch.',
    tryThis: [
      'Open ZONE and pick a starting point, then a different one. Resting the mic in two zones, clear of every part, finishes this module’s activity.',
      'From a zone, change only POSITION or only AIM, and read how the readouts and the card under the drawing change.',
    ],
  },
  // ADVANCED (pages/PContext.tsx, pages/PTwoMic.tsx, pages/PReadPages.tsx)
  'LIVE|Aim the rejection': {
    engineOnly: true,
    intro: {
      learning: 'Aiming a mic’s null at a loud nearby source, such as a stage monitor, keeps that source quieter in the mic.',
      start: 'Pick the loud source in MONITOR and make your prediction. Then turn AIM until REJECTION reads IN NULL.',
    },
    seeing: 'The mic and the loud source you picked in MONITOR, placed where this situation often puts it (LIVE). STUDIO shows no such source.',
    control: 'AIM turns the mic; PATTERN, MONITOR and the LIVE / STUDIO key set the scene.',
    changes: 'PICKUP is what the pattern hears from that source’s direction; when the source sits close to a null, REJECTION reads IN NULL.',
    tryThis: [
      'Make the prediction, then turn AIM until REJECTION reads IN NULL.',
      (s) =>
        optsOf(s, 'PATTERN').filter((o) => !isOmni(o)).length >= 2
          ? 'After your prediction, switch PATTERN between choices that have a null and watch NULL move: the rear is not always the quietest side.'
          : 'Turn AIM slowly away from the null: PICKUP climbs as the source leaves the quiet side.',
    ],
  },
  'PAIR|Pair and polarity': {
    engineOnly: true,
    intro: {
      learning: 'Why two mics on one source can cancel some frequencies: the farther mic hears it later, and adding the two signals makes a comb of notches.',
      start: 'Move a mic so the two paths differ more, and watch DELAY Δt B−A grow and 1ST NOTCH drop. Then flip MIC B POLARITY and compare.',
    },
    seeing: 'Two mics, A and B, each with a dashed straight path from one source. The comb panel under the display shows what you get when their signals are added.',
    control: 'EDIT MIC B / EDIT MIC A switches which mic POSITION and AIM move. MIC B POLARITY flips mic B’s signal upside down. SOURCE picks where the paths start.',
    changes: 'The longer path arrives later (Δt). Added together, that delay cancels some frequencies: the comb’s notches. Flipping polarity swaps notches and peaks, but Δt stays.',
    tryThis: [
      'Flip MIC B POLARITY to − and back: DELAY Δt B−A does not change.',
      // POLARITY's lower line reads 'switch', or 'heads: −' / 'rear lobe: −' when the
      // mic's own lobe flips the sum (PTwoMic bezel), so the words are quoted.
      'Make the paths differ more: Δt grows and 1ST NOTCH drops; nearly equal, it reads OVER 20 kHz. If POLARITY’s lower line reads heads: − or rear lobe: −, the sum has flipped: notches and peaks swap.',
    ],
  },
  'READ|Symptoms': {
    intro: {
      learning: 'How to work back from a symptom you hear to the first thing worth checking, and why one check comes before the others.',
      start: 'Read each OBSERVATION card and tap what you would check first. If your pick is wrong, read why, then choose again.',
    },
    seeing: 'Each card describes a symptom, headed OBSERVATION. Your job is to choose what to check first.',
    control: 'On each card, tap the first thing you would check. A wrong pick tells you why, and you choose again. Answering every card finishes this module’s activity.',
    tryThis: ['Choose an option you doubt, on purpose, and read its reason. Choosing again is never held against you.'],
  },
  // PRACTICE (pages/PReadPages.tsx; shared/journeyPages.tsx draws the same)
  'PRACTICE|Set up in order': {
    intro: {
      learning: 'Setting up a mic follows an order: some steps only make sense once others are done, and the reason tells you which comes first.',
      start: 'Read all the shuffled steps first. Then tap the step that comes next, one at a time. If one can’t come yet, read why.',
    },
    seeing: 'The steps of a setup, shuffled for you to put in order, then one more check card.',
    control: 'Tap the step that comes next. If you tap one too early, you’re told why it can’t come yet.',
    tryThis: ['Read every step before you tap. A step tapped too early tells you what has to happen first, and your first try is noted.'],
  },
  'PRACTICE|Your setup': {
    intro: {
      learning: 'A brief can be met by more than one setup; what makes a setup right is the reasons behind it.',
      start: 'Read the brief and choose a setup. Then check every reason that justifies it, and only those.',
    },
    seeing: 'Each setup brief accepts more than one setup, and the check reads your reasons, not a single position.',
    control: 'Choose a setup, then check every reason that justifies it.',
    tryThis: ['On a brief, choose a setup and check only the reasons you could defend to the people you are working with.'],
  },
  'PRACTICE|Mixed review': {
    intro: {
      learning: 'How the whole lesson fits together, from where the sound leaves to the setup, the mic and its placement.',
      start: 'Answer each review card; a wrong pick tells you why. Then look at the optional OBSERVATION SHEET to use at your next real session.',
    },
    seeing: 'Questions that reach back across the whole lesson, plus an optional OBSERVATION SHEET to use at a real session.',
    control: 'Answer each card. A wrong pick tells you why, and you choose again. The OBSERVATION SHEET below is optional.',
    tryThis: ['Answer the review first, then fill in the OBSERVATION SHEET the next time you place a real mic.'],
  },
};

/** Is this module drawn by the engine's own page? (MikingLessonScreen's
 *  journeyPages: a lesson's `art.pages` replaces a module, or the part a
 *  composed module is built from.) MICROPHONES always opens with the
 *  engine's ON THE INSTRUMENT step. */
export function enginePageOf(page: PageId, ownPageIds: readonly string[]): boolean {
  const own = new Set(ownPageIds);
  if (page === 'meet') return !own.has('meet') && !own.has('instrument');
  if (page === 'setups') return !own.has('setups');
  if (page === 'microphone') return true;
  return !own.has(page);
}

/** The note for the step on screen, if one applies. */
export function stepNoteFor(s: MikingStepInfo | null, enginePage: boolean): StepNote | undefined {
  if (!s) return undefined;
  const title = SETUPS_TITLES.includes(s.title) ? SETUPS_STEP_NAME : s.title;
  const n = STEP_NOTES[`${s.kind}|${title}`];
  return n && (!n.engineOnly || enginePage) ? n : undefined;
}

const say = (w: Words | undefined, s: MikingStepInfo | null): string => (w === undefined || !s ? '' : typeof w === 'function' ? w(s) : w);

// ═══ STAGES (docs/labs/miking/LESSON_JOURNEY.md) ═════════════════════════

type StageWords = { changes: readonly string[]; teaches: string; tryThis: string };

const STAGE_WORDS: Record<PageId, StageWords> = {
  meet: {
    changes: [
      'Sound leaves a source from particular places — a struck head, a bell, open holes, a soundboard, a speaker, a mouth. A mic hears most directly where the sound leaves.',
      'The lab is silent: nothing is played, and anything that moves is drawn so you can watch it.',
    ],
    teaches: 'Where the sound leaves is where most close setups start, and a distance means something only when you know the surface it is measured from.',
    tryThis: 'Before NEXT ›, say where the sound leaves — then check which surface each setup in the next module is measured from.',
  },
  setups: {
    changes: [
      'A distance is measured from a named surface to the mic’s front, so a number only means something with its surface.',
      'Move closer for more source and less room; a directional mic also gains bass up close (proximity effect). Move farther to hear more of the whole source and the room.',
    ],
    teaches: 'Several setups can each do the job; each trades something, such as more source for less room.',
    tryThis: 'Think back to two starting setups: what does each one gain, and what does it give up?',
  },
  microphone: {
    changes: [
      'A pickup pattern is a map of where a mic listens. Its quiet direction, a null, is a tool: aim it at what you do not want.',
      'Power, size and mount decide where a mic can go. Many condensers take phantom power, some their own battery or supply; a clip-on mic moves with the source.',
    ],
    teaches: 'A mic is chosen by its properties — pattern, power, size and mount — not by its brand.',
    tryThis: 'For this job, decide which matters most — pattern, power, size or mount — then check it against this module.',
  },
  placement: {
    changes: [
      'Distance, height and aim each change what the mic hears: closer gives more source, less room; aim away and it hears less source, losing the top end first.',
      'Clearance comes first: the mic stops where it would touch a part, and moving parts and the player keep their space.',
    ],
    teaches: 'A starting point is read from a named surface, aimed and kept clear — then moved by ear.',
    tryThis: 'From a starting point, change one thing only — distance, height or aim — and read what the words say changes.',
  },
  context: {
    changes: ['From here the help steps back: the module sets out a real situation, and you decide where the mic goes and why.'],
    teaches: 'The foundations — where the sound leaves, distance, the pattern’s null and clearance — decide what works in a real situation.',
    tryThis: 'Read the goal at the top again, then find on this step the thing it asks you to judge.',
  },
  twoMic: {
    changes: ['From here the help steps back: the module sets out a real situation, and you decide where the mic goes and why.'],
    teaches: 'When more than one pickup hears the same sound, the difference in their timing changes what you hear when they are combined.',
    tryThis: 'Read the goal at the top again, then find on this step the thing it asks you to judge.',
  },
  troubleshoot: {
    changes: ['Each symptom has likely first checks; each option’s explanation says why one comes before the others.'],
    teaches: 'What you hear points back to the first thing worth checking.',
    tryThis: 'Choose a wrong option on purpose and read the reason: each one says why it is not the first check.',
  },
  practice: {
    changes: ['A brief can accept more than one setup: the check reads your reasons, not a single “right” position.'],
    teaches: 'A setup is right for reasons you can name — the source, the room, the pattern, clearance — and more than one can meet a brief.',
    tryThis: 'On a setup brief, choose a setup and check only the reasons you could defend.',
  },
};

/** The sharper physics, for modules that keep the engine's default title. */
const DEFAULT_TITLE_WORDS: Partial<Record<PageId, { titles: readonly string[]; changes: readonly string[]; tryThis: string }>> = {
  context: {
    titles: ['Studio or live'],
    changes: [
      'On a stage, loud sources such as monitors sit near the mic. A directional pattern hears less from its null, so a monitor in the null leaves more level before feedback, the howl of a mic hearing its own speaker.',
      'A pattern only helps from its quiet side: sound reaching the mic from the front is heard in full.',
    ],
    tryThis: 'Find the loudest unwanted source on this step and decide which way the mic’s quiet side must face.',
  },
  twoMic: {
    titles: ['Two microphones'],
    changes: [
      'When two mics hear one source, the farther one hears it later. Added together, that delay cancels some frequencies — a comb of notches.',
      'Polarity turns one signal upside down: the notches and peaks swap, but the delay stays.',
    ],
    tryThis: 'Picture the two mics’ distances from the source: their difference is PATH Δd, and the time sound takes to cross it is DELAY Δt.',
  },
};

// ═══ THE BUILDER ═════════════════════════════════════════════════════════

export type MikingGuideInput = {
  page: PageId;
  /** The strip's MODULE number (1-based). */
  pageNum: number;
  /** The module's title (the header) and its goal (the head of step 1). */
  pageTitle: string;
  goal: string;
  prevTitle: string | null;
  nextTitle: string | null;
  /** The step on screen (null until it reports). */
  step: MikingStepInfo | null;
  first: boolean;
  last: boolean;
  credited: boolean;
  /** The module is drawn by the engine's own page (enginePageOf). */
  enginePage: boolean;
};

type Line = { text: string; req: boolean };
const req = (text: string): Line => ({ text, req: true });
const opt = (text: string): Line => ({ text, req: false });

/** Keep a section inside its no-scroll budget: optional lines drop from the
 *  end first. The required lines are written to fit on their own (pinned by
 *  the test across every lesson). */
function fit(lines: readonly (Line | null | false | undefined)[], cap: number): string[] {
  const out = lines.filter((l): l is Line => !!l && l.text.length > 0);
  const len = () => out.map((l) => l.text).join(' ').length;
  for (let i = out.length - 1; i >= 0 && len() > cap; i--) if (!out[i].req) out.splice(i, 1);
  // At most five lines: drop optional lines (last first) before any required one.
  for (let i = out.length - 1; i >= 0 && out.length > 5; i--) if (!out[i].req) out.splice(i, 1);
  return out.slice(0, 5).map((l) => l.text);
}

/** Each step kind in a phrase (the word the strip puts before the title). */
const KIND_WORDS: Readonly<Record<string, string>> = {
  WATCH: 'shown for you: step through it and look',
  LEARN: 'one idea, explained',
  TRY: 'hands-on: tap or move something and watch what it changes',
  COMPARE: 'switch between choices and compare',
  PLACE: 'you move the mic yourself',
  LIVE: 'a live-sound situation to work through',
  PAIR: 'two pickups hearing the same source',
  POLARITY: 'two mics, and what flipping one’s polarity does',
  CHECK: 'questions on what this module showed',
  PRACTICE: 'practice that pulls the lesson together',
  READ: 'words and still drawings to read',
};

function keyPhrase(k: MikingDockKey, level: 0 | 1 | 2): string {
  if (level === 2) return k.label;
  const list = k.options.join(' / ');
  const full = level === 0 && list.length <= 60;
  const menu = k.options.length ? (full ? list : `${k.options.length} choices`) : '';
  switch (k.kind) {
    case 'fader':
      return `${k.label} (slider${menu ? `; menu: ${menu}` : ''})`;
    case 'options':
      return `${k.label} (${!menu ? 'a choice key' : full ? `choices: ${menu}` : menu})`;
    case 'group':
      return `${k.label} (opens a tray)`;
    case 'toggle':
      return `${k.label} (tap to switch)`;
    default:
      return `${k.label} (button)`;
  }
}

const STRIP_LINE = 'In the strip under the title, ‹ PREV and NEXT › move one step, on into the next module (FINISH › at the very end); ⏮ returns to module 1. Tap the middle readout (MODULE, plus STEP when there are several) for the contents. Every module stays open.';
/** The header's other ⓘ: the lesson's starting-points note (AccuracyNote). */
const CHIP_LINE = 'The other ⓘ, beside the one you tapped, opens the lesson’s ABOUT THESE STARTING POINTS note.';
const FULL_LINE = '⤢ FULL SCREEN shows the drawing at full size, with zoom. ▴ HIDE DISPLAY gives the words the whole screen.';

function sequenceLine(prev: string | null, next: string | null): string {
  if (!prev && next) return `The first module: “${next}” builds on it.`;
  if (prev && !next) return `The last module: it builds on “${prev}” and every module before it.`;
  return `It builds on “${prev ?? ''}” and comes before “${next ?? ''}”.`;
}

/** The guide for the step on screen. */
export function mikingScreenGuide(x: MikingGuideInput): ScreenGuide {
  const s = x.step;
  const note = stepNoteFor(s, x.enginePage);
  const stage = stageOf(x.page);
  const words = STAGE_WORDS[x.page];
  const sharp = DEFAULT_TITLE_WORDS[x.page];
  // Only on the engine's own page: a family page can keep the engine's title
  // and draw something else (M11's "Studio or live" is a routing matrix).
  const isDefault = !!sharp && x.enginePage && sharp.titles.includes(x.pageTitle);
  const rack = s?.layout === 'rack';
  const sameAsStage = stage.title.toLowerCase() === x.pageTitle.toLowerCase() || x.page === 'meet';

  // ── WHAT YOU'RE SEEING ──
  const seeing = fit(
    [
      req(`MODULE ${x.pageNum} · ${x.pageTitle.toUpperCase()}.`),
      s ? req(`This step is ${s.label}: ${KIND_WORDS[s.kind] ?? 'one part of this module'}.`) : null,
      note?.seeing ? req(say(note.seeing, s)) : null,
      rack
        ? req('Look at the drawing, then read the line under it: it says how to read the drawing and what it leaves out.')
        : s && s.kind !== 'READ'
          ? opt('A reading step: words and still drawings, no live display.')
          : null,
      rack && s && s.bezel.length ? opt(`Watch ${s.bezel.join(', ')} in the readouts, the cells framing the display.`) : null,
      sameAsStage ? null : opt(`It is part of the journey’s ${stage.title.toUpperCase()} stage.`),
      x.first ? opt(`At the top, “Page ${x.pageNum} goal:” says what this module asks.`) : null,
      x.last ? opt(x.credited ? 'At the end, read the takeaway card; “This page is credited.” means this module is done.' : 'At the end, read the takeaway card, then the TO EARN CREDIT line: it says what finishes this module.') : null,
    ],
    SCREEN_GUIDE_BUDGET.low,
  );

  // ── WHAT YOU CONTROL ──
  const dockLine = (level: 0 | 1 | 2) => (s && s.dock.length ? `In the dock: ${s.dock.map((k) => keyPhrase(k, level)).join('; ')}.` : '');
  const hasPos = !!s && s.dock.some((k) => k.label === 'POSITION' && k.kind === 'fader');
  // "Nothing to set" only for a known read step whose every copy holds no
  // card to answer (the notes without a control line); a family's unknown
  // read step, or any PRACTICE step, may hold answer cards.
  const readControl = s && !rack
    ? s.kind === 'CHECK'
      ? 'Tap an answer. A wrong pick tells you why, and you choose again. The end screen notes your first try.'
      : note?.control
        ? ''
        : note && s.kind !== 'PRACTICE'
          ? 'Nothing to set on this step: read it, then NEXT ›.'
          : s.kind === 'PRACTICE'
            ? 'Answer each card on this step. A wrong pick tells you why, and you choose again.'
            : 'Read it, answer any card it holds, then NEXT ›.'
    : '';
  const controlFor = (level: 0 | 1 | 2) =>
    fit(
      [
        rack ? req(dockLine(level) || 'No dock keys on this step: just look at the drawing.') : null,
        note?.control ? req(say(note.control, s)) : null,
        readControl ? req(readControl) : null,
        hasPos ? opt('Drag the mic on the display, or use POSITION and AIM instead. A part in the way stops the mic, and ✕ names that part.') : null,
        rack ? opt(FULL_LINE) : null,
        opt(CHIP_LINE),
        req(STRIP_LINE),
      ],
      SCREEN_GUIDE_BUDGET.high,
    );
  let control = controlFor(0);
  if (control.join(' ').length > SCREEN_GUIDE_BUDGET.high) control = controlFor(1);
  if (control.join(' ').length > SCREEN_GUIDE_BUDGET.high) control = controlFor(2);

  // ── WHAT CHANGES — AND WHY ──
  const stageChanges = isDefault ? sharp!.changes : words.changes;
  const changes = fit(
    [
      note?.changes ? req(say(note.changes, s)) : null,
      // With a step note's own line, the stage's first line is optional: both
      // required ran past the no-scroll budget (Guided Lessons return 2026-11-08).
      note?.changes ? opt(stageChanges[0]) : req(stageChanges[0]),
      ...stageChanges.slice(1).map(opt),
      rack ? opt('Each dock change shows on the drawing, in the readouts or in the words under it. The lab plays no sound, so you read the change rather than hear it.') : null,
    ],
    SCREEN_GUIDE_BUDGET.low,
  );

  // ── WHAT THIS TEACHES ──
  // The sequence line is told as progression ("builds on", "comes before"),
  // not navigation (Guided Lessons return 2026-11-08).
  const seq = sequenceLine(x.prevTitle, x.nextTitle);
  const goalLine = `This module’s goal: ${x.goal}`;
  const teaches = fit(
    [
      req(goalLine.length + seq.length + 1 <= SCREEN_GUIDE_BUDGET.low ? goalLine : x.goal),
      req(seq),
      opt(words.teaches),
    ],
    SCREEN_GUIDE_BUDGET.low,
  );

  // ── TRY THIS ──
  const tries: string[] = (note?.tryThis ?? []).map((w) => say(w, s));
  if (s && rack && tries.length < 2) {
    const fader = s.dock.find((k) => k.kind === 'fader');
    // Only a key with something to switch to (a one-choice TYPE has nothing).
    const choice = s.dock.find((k) => k.kind === 'options' && k.options.length >= 2);
    const toggle = s.dock.find((k) => k.kind === 'toggle');
    if (fader) tries.push(`Slide ${fader.label} from one end to the other and watch what changes on the drawing and in the readouts.`);
    if (choice && tries.length < 3) tries.push(`Open ${choice.label} and try each choice in turn: what changes on the drawing and in the words under it?`);
    if (toggle && tries.length < 3) tries.push(`Tap ${toggle.label} and compare the drawing in both settings.`);
    if (tries.length < 2) tries.push('Open ⤢ FULL SCREEN and zoom in on the part this step is about.');
  }
  if (s && !rack && s.kind === 'CHECK' && tries.length < 2) tries.push('Answer the card you are least sure of first: a wrong pick shows its reason, and you choose again.');
  if (tries.length < 2) tries.push(isDefault ? sharp!.tryThis : words.tryThis);
  if (tries.length < 2) tries.push('Before you move on, say in one sentence what this step showed you about the sound.');
  // Owner 2026-11-11 (UF-56CAE25AB2): the cross-reference lives in TRY THIS, not WHAT THIS TEACHES.
  if (x.page === 'microphone' && tries.length < 3) tries.push('Microphone Principles, in Audio Fundamentals, covers pickup patterns in depth.');
  const tryThis = tries.slice(0, 3);

  return { ...(note?.intro ? { intro: note.intro } : {}), seeing, control, changes, teaches, tryThis };
}

// ═══ THE FOUNDATIONS CARD (journeyKit.FoundationsCard) ═══════════════════

/** In place of a module's activity until the first two modules are met. */
export function mikingFoundationsGuide(x: { pageNum: number; pageTitle: string; prevTitle: string | null; nextTitle: string | null }): ScreenGuide {
  return {
    seeing: [
      `MODULE ${x.pageNum} · ${x.pageTitle.toUpperCase()} shows BUILT ON THE FIRST TWO PAGES in place of its activity: it needs what the first two modules show.`,
      'The first two modules are listed: ✓ when done, or ○ with an OPEN button.',
    ],
    control: [
      'OPEN jumps to that module.',
      'The QUICK CHECK button (I ALREADY MIC …) switches you to the quick check and opens module 1, where the check is.',
      STRIP_LINE,
      CHIP_LINE,
    ],
    changes: [
      'Each of the first two modules counts the moment you finish it, so this activity opens straight away.',
      'Passing the quick check opens every activity, but it finishes nothing: you still complete the first two modules yourself.',
    ],
    teaches: [
      `“${x.pageTitle}” puts a microphone to work: it builds on where the sound leaves and the starting setups.`,
      sequenceLine(x.prevTitle, x.nextTitle),
    ],
    tryThis: [
      'Tap OPEN beside a module not yet done, finish it, and come back: its row turns ✓.',
      'Already mic this source? Tap the QUICK CHECK button and answer the check — your first try is the one that counts.',
    ],
  };
}

// ═══ THE WHAT'S-LEFT SCREEN (kit/LabEndScreen, mode "progress") ══════════

export const MIKING_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How a miking lesson fits together: find where the sound leaves, compare setups, choose the mic, place it clear of everything, then test it in real situations.',
    start: 'Read LAB COMPLETE, or the WHAT’S LEFT rows and what each module still needs. Tap a row to jump to that module, or open REVIEW ▾ to look back at the ones you’ve done.',
  },
  seeing: [
    'You’ve reached the end of this lesson. LAB COMPLETE means every module is done. Otherwise WHAT’S LEFT lists each module still to do, what it needs, and any note on your first try.',
    'Open REVIEW ▾ to look back at the modules you’ve finished.',
  ],
  control: [
    'Tap a row to jump straight to that module.',
    // DONE is safeGoBack (MikingLessonScreen): back one screen, which is the
    // family's lesson list when the lesson was opened from the hub.
    'PRACTICE AGAIN FROM THE START begins a fresh practice run at module 1. DONE · BACK TO LABS leaves the lesson and goes back one screen, usually to this family’s list of lessons.',
    '‹ PREV returns to the module you came from, just as you left it.',
    CHIP_LINE,
  ],
  changes: [
    'A module is done when its own requirement is met: its checks answered right, or its activity finished. A module with neither is done once you move past it.',
    'A fresh practice run clears your answers and activities; modules you’ve finished stay done.',
  ],
  teaches: [
    'Miking follows the same order of decisions every time: find where the sound leaves, compare starting setups, choose the mic by its properties, then place it and keep it clear.',
    // "such as": a family's own pages can replace an advanced module (M11's routing matrix).
    'The same foundations apply in real situations, such as a stage, a second pickup or a fault to trace, and more than one setup can work, for reasons you can name.',
  ],
  tryThis: [
    'Jump to a module whose row has a first-try note and reread its checks: each right answer stays shown with its reason. A fresh practice run lets you answer them again.',
    'Start a fresh practice run and choose I already mic … in the first module. The quick check shows whether the foundations have stuck.',
  ],
};

// ═══ THE FAMILY HUB (MikingHubScreen) ════════════════════════════════════

/** The hub's guide: one family's lessons (the Labs menu tile), or every
 *  family in turn when no family is named. */
export function mikingHubGuide(family?: { family: string }): ScreenGuide {
  const where = family ? `${family.family.toUpperCase()}: one tile per lesson in this family` : 'MIKING LABS: every family’s lessons, under a heading for each family';
  return {
    seeing: [
      `${where}. The line at the top says what the lessons cover.`,
      'Each tile shows the lesson’s name, what it covers and how many of its modules you’ve done (the tile calls them pages). ✓ marks a finished lesson.',
      'At the bottom, a reminder: these lessons suggest where to begin — starting points, not rules.',
    ],
    control: [
      'Tap a tile to open that lesson. When your progress is saved, it opens where you left off.',
      '‹ goes back to the Labs menu.',
    ],
    changes: [
      'A tile’s count grows as that lesson’s modules are done; practicing again never lowers it.',
      'If your progress can’t be loaded, the count shows “—” and a note says so. Every lesson still opens.',
    ],
    teaches: [
      'Miking follows one order whatever the source: where the sound leaves, real starting setups, the mic’s properties, placement, advanced situations and practice. Here it is all silent and drawn.',
    ],
    tryThis: [
      'Open a lesson and look at THE JOURNEY map on its first step: the same stages run through every lesson here.',
      'Finish a module, come back, and find that tile’s count has grown (when your progress is saved).',
      'Microphone Principles, in Audio Fundamentals, covers pickup patterns and distance; these lessons put them to work on real sources.',
    ],
  };
}
