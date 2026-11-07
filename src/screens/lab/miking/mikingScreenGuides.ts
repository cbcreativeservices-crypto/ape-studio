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
 *      "Two microphones", "Choose the microphone(s)").
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
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import { SCREEN_GUIDE_BUDGET } from '../../../features/lab/screenGuide/types.ts';
import type { PageId } from './engine/model/types.ts';
import { stageOf } from './engine/journey.ts';

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
    seeing: 'THE JOURNEY map lists the lesson’s stages; “How would you like to start?” offers two paths.',
    control: 'Tap New to miking … to go in order, or I already mic … for the six-question quick check, shown on this step.',
    changes: 'The path only changes what is suggested next. A passed quick check opens every activity now, but credits nothing: the first two modules still earn their own credit.',
    tryThis: [
      'Choose New to miking …: NEXT › then walks through the lesson in order. The choice can be changed here at any time.',
      'Choose I already mic … and read the QUICK CHECK line before answering: your first try is the one that counts.',
    ],
  },
  'LEARN|What it is': {
    seeing: 'A drawing and short facts, one card each: what it is, before any mic appears.',
    tryThis: ['Read each card’s title, then find what it names on the drawing.'],
  },
  'TRY|The parts': {
    engineOnly: true,
    seeing: 'The drawing lights the part you pick; its card says what it does and, where it applies, WHERE SOUND COMES FROM.',
    control: 'Tap any part on the drawing, or step through PART in the dock. There is nothing to answer on this step.',
    changes: 'A part’s card names the places its sound leaves: those are where a mic can hear it best.',
    tryThis: [
      'Tap the part the sound leaves from and read its WHERE SOUND COMES FROM line.',
      'Go through every part with PART: the bezel names each one as you reach it.',
    ],
  },
  // STARTING SETUPS (pages/PSetups.tsx)
  'WATCH|Starting setups': {
    engineOnly: true,
    seeing: 'One real setup at a time, drawn where the mic goes: the mic and its mount, where it points (amber, dashed) and its distance (white).',
    control: (s) => `${has(s, 'SETUP') ? 'Step through SETUP, or pick one by name in SETUPS' : 'Pick each setup by name in SETUPS'}. The mics are placed for you here; nothing is dragged.`,
    changes: 'Each card gives the mic type and pattern, a START line (distance and aim) and what it TENDS TO do — a suggested starting point, not a rule.',
    tryThis: [
      (s) => `Go through every setup${has(s, 'SETUP') ? ' with SETUP' : ' in SETUPS'}: looking at the main setups is part of this module’s credit.`,
      'End on the setup you would try first: the Placement Studio starts from the last one you look at.',
    ],
  },
  'LEARN|What else the mic hears': {
    seeing: 'What reaches the mic besides the source, what the mic and its stand keep clear of, and what changes ON A STAGE (LIVE) or IN A STUDIO.',
    tryThis: [
      'Pick one neighbor named here and decide which way the mic’s quiet side would face to hear less of it.',
      'Go back one step to Starting setups and compare two: what does each one gain, and what does it give up?',
    ],
  },
  // MICROPHONES (pages/PMicOnIt.tsx — every lesson; pages/PMicrophone.tsx and
  // shared/journeyPages.tsx draw the same two steps)
  'LEARN|On the instrument': {
    seeing: 'The chosen mic type drawn where this lesson starts it: its mount, its pickup shape (dashed lobe) and its distance (white).',
    control: 'Choose a TYPE: each is redrawn where this lesson starts it. PATTERN lists the patterns that type has.',
    changes: 'POWER is read from each type’s own power needs: PHANTOM (from the desk), NONE (a dynamic or passive ribbon), BATTERY or OWN SUPPLY (a meter or measurement mic), VARIES (more than one way: the card says which).',
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
    seeing: 'A pickup pattern from above with a test source around it — a simplified shape, the same at every pitch.',
    control: 'SOURCE ANGLE swings the test source from the mic’s front (0°) around to directly behind (180°). TYPE and PATTERN change the mic.',
    changes: 'PICKUP is the pattern’s level at that angle compared with straight ahead. Where the pattern hears nothing, a null appears (DEEP NULL): sound from there cancels at the capsule. Real mics still hear a little from there.',
    tryThis: [
      'Make the prediction, then sweep SOURCE ANGLE slowly, front to back: the NULL readout shows where this pattern rejects most.',
      (s) =>
        optsOf(s, 'PATTERN').some(isCardioid)
          ? 'With a cardioid PATTERN, set SOURCE ANGLE all the way around: PICKUP reads DEEP NULL, directly behind.'
          : 'Set SOURCE ANGLE all the way around, directly behind: PICKUP shows how much this pattern hears from the back.',
    ],
  },
  'LEARN|By property, not brand': {
    seeing: 'One card per mic type this lesson uses: what it is, the power it needs, how it mounts and its pattern — no brands.',
    control: 'Tap SPEC DETAILS ▾ on a card for its full power line and its size.',
    tryThis: ['Open SPEC DETAILS on two cards: what power does each one really need, and which mounts the way this job needs?'],
  },
  // PLACEMENT STUDIO (pages/PPlacement.tsx)
  'WATCH|Worked example': {
    engineOnly: true,
    seeing: 'A worked example: the mic placed for you at one suggested starting point (blue). The lit bezel cell (▸) is the piece being read.',
    control: 'STEP reads the example piece by piece, from WHERE TO BEGIN to CLEARANCE; the drawing marks the part a piece is about.',
    changes: 'Distances read to the mic’s FRONT from a named surface: the same number from another surface would put the mic somewhere else.',
    tryThis: [
      'Step to THE DISTANCE: the lit bezel cell reads inside the suggested range written in the card.',
      'Step to CLEARANCE and read why clearance comes before any sound.',
    ],
  },
  'PLACE|Place the mic': {
    engineOnly: true,
    seeing: (s) => `Your mic${has(s, 'START') ? ', starting from the setup in START' : ''}. Blue = suggested starting points; keep-clear areas show as the mic comes near.`,
    control: 'ZONE jumps the mic to a suggested starting point. SETUP opens MIC TYPE, a row of versions of the source (under its own heading) and MEASURE FROM.',
    changes: 'Inside a blue zone its card says what it tends to do; outside, the words list the zones in reach. A part in the way stops the mic where it would touch.',
    tryThis: [
      'Open ZONE and pick a starting point, then a different one: two zones rested in, clear of every part, is this module’s activity.',
      'From a zone, change only POSITION or only AIM, and read how the bezel and the card under the drawing change.',
    ],
  },
  // ADVANCED (pages/PContext.tsx, pages/PTwoMic.tsx, pages/PReadPages.tsx)
  'LIVE|Aim the rejection': {
    engineOnly: true,
    seeing: 'The mic and the loud source picked in MONITOR, placed where this situation often puts it (LIVE); STUDIO has none.',
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
    seeing: 'Two mics, A and B, with dashed straight paths from one source; the comb panel under the display draws their sum.',
    control: 'EDIT MIC B / EDIT MIC A switches which mic POSITION and AIM move; MIC B POLARITY flips mic B; SOURCE picks where the paths start.',
    changes: 'The longer path arrives later (Δt). Summed, that delay cancels some frequencies — the comb’s notches. Polarity swaps notches and peaks; Δt stays.',
    tryThis: [
      'Flip MIC B POLARITY to − and back: DELAY Δt B−A does not change.',
      'Move a mic so the paths differ more: Δt grows and 1ST NOTCH drops; nearly equal, it reads OVER 20 kHz. If POLARITY’s lower line leaves “switch”, the sum has flipped and the notch jumps.',
    ],
  },
  'READ|Symptoms': {
    seeing: 'Symptom cards, each an OBSERVATION: choose what to check first.',
    control: 'Tap the first thing you would check on each card; a wrong pick says why — choose again. Answering every card is this module’s activity.',
    tryThis: ['Choose an option you doubt on purpose: its reason appears, and a retry is explained, never penalized.'],
  },
  // PRACTICE (pages/PReadPages.tsx; shared/journeyPages.tsx draws the same)
  'PRACTICE|Set up in order': {
    seeing: 'Setup steps, shuffled, to put in order, then one more check card.',
    control: 'Tap the step that comes next; a step tapped too early is answered with why it cannot come yet.',
    tryThis: ['Read every step before tapping: a step tapped too early is answered with what has to happen first — and your first try is noted.'],
  },
  'PRACTICE|Your setup': {
    seeing: 'Setup briefs: each accepts more than one setup, and the check reads your reasons.',
    control: 'Choose a setup, then check every reason that justifies it.',
    tryThis: ['On a brief, choose a setup and check only the reasons you could defend to the people you are working with.'],
  },
  'PRACTICE|Mixed review': {
    seeing: 'Questions reaching back across the lesson, and an optional OBSERVATION SHEET for a real session.',
    control: 'Answer each card; a wrong pick says why — choose again. The OBSERVATION SHEET below is optional.',
    tryThis: ['Answer the review first, then fill the OBSERVATION SHEET the next time you place a real mic.'],
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
  const n = STEP_NOTES[`${s.kind}|${s.title}`];
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
    teaches: 'Where the sound leaves is where most close setups start; every distance in this lesson names the surface it is measured from.',
    tryThis: 'Before NEXT ›, say where the sound leaves — then check which surface each setup in the next module is measured from.',
  },
  setups: {
    changes: [
      'A distance is measured from a named surface to the mic’s front, so a number only means something with its surface.',
      'Closer: more source, less room; a directional mic gains bass up close (proximity effect). Farther: more of the whole.',
    ],
    teaches: 'Several setups can each do the job; seeing them first makes the mic choice and the placement make sense.',
    tryThis: 'Think back to two starting setups: what does each one gain, and what does it give up?',
  },
  microphone: {
    changes: [
      'A pickup pattern is a map of where a mic listens. Its quiet direction, a null, is a tool: aim it at what you do not want.',
      'Power, size and mount decide where a mic can go: many condensers take phantom power, some their own battery or supply; a clip moves with the source.',
    ],
    teaches: 'Choosing by property — pattern, power, size and mount — not by brand.',
    tryThis: 'For this job, decide which matters most — pattern, power, size or mount — then check it against this module.',
  },
  placement: {
    changes: [
      'Distance, height and aim each change what the mic hears: closer gives more source, less room; aiming away hears less source, its top end first.',
      'Clearance comes first: the mic stops where it would touch a part, and moving parts and the player keep their space.',
    ],
    teaches: 'A starting point is read from a named surface, aimed and kept clear — then moved by ear.',
    tryThis: 'From a starting point, change one thing only — distance, height or aim — and read what the words say changes.',
  },
  context: {
    changes: ['The Advanced stage: the help fades — the module sets out a situation, and you work out the decision.'],
    teaches: 'Applying the foundations to a real situation.',
    tryThis: 'Read the goal at the top again, then find on this step the thing it asks you to judge.',
  },
  twoMic: {
    changes: ['The Advanced stage: the help fades — the module sets out a situation, and you work out the decision.'],
    teaches: 'What changes when more than one pickup hears the same sound.',
    tryThis: 'Read the goal at the top again, then find on this step the thing it asks you to judge.',
  },
  troubleshoot: {
    changes: ['Each symptom has likely first checks; each option’s explanation says why one comes before the others.'],
    teaches: 'Working back from what you hear to the first thing worth checking.',
    tryThis: 'Choose a wrong option on purpose and read the reason: each one says why it is not the first check.',
  },
  practice: {
    changes: ['A brief can accept more than one setup: the check reads your reasons, not a single “right” position.'],
    teaches: 'Putting the whole lesson together, with reasons.',
    tryThis: 'On a setup brief, choose a setup and check only the reasons you could defend.',
  },
};

/** The sharper physics, for modules that keep the engine's default title. */
const DEFAULT_TITLE_WORDS: Partial<Record<PageId, { titles: readonly string[]; changes: readonly string[]; tryThis: string }>> = {
  context: {
    titles: ['Studio or live'],
    changes: [
      'On a stage, loud sources such as monitors sit near the mic. A directional pattern hears less from its null, so a monitor in the null leaves more level before feedback.',
      'A pattern only helps from its quiet side: sound reaching the mic from the front is heard in full.',
    ],
    tryThis: 'Find the loudest unwanted source on this step and decide which way the mic’s quiet side must face.',
  },
  twoMic: {
    titles: ['Two microphones'],
    changes: [
      'When two mics hear one source, the farther one hears it later. Summed, that delay cancels some frequencies — a comb of notches.',
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
  TRY: 'hands-on: tap or move something and see it answer',
  COMPARE: 'switch between choices and compare',
  PLACE: 'you move the mic yourself',
  LIVE: 'a live-sound situation to work through',
  PAIR: 'two pickups at once',
  POLARITY: 'two mics and polarity',
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

const STRIP_LINE = 'The strip under the title: ‹ PREV and NEXT › move one step, on into the next module (FINISH › at the very end); ⏮ returns to module 1. Tap the middle readout (MODULE, plus STEP when there are several) for the contents. Every module stays open.';
/** The header's other ⓘ: the lesson's starting-points note (AccuracyNote). */
const CHIP_LINE = 'The other ⓘ beside this key opens the lesson’s ABOUT THESE STARTING POINTS note.';
const FULL_LINE = '⤢ FULL SCREEN shows the drawing at full size with zoom; ▴ HIDE DISPLAY gives the words the whole screen.';

function sequenceLine(prev: string | null, next: string | null): string {
  if (!prev && next) return `The first module; next comes “${next}”.`;
  if (prev && !next) return `After “${prev}” — the last module; FINISH › then shows what is left.`;
  return `After “${prev ?? ''}”; next comes “${next ?? ''}”.`;
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
      s ? req(`This step is ${s.label} — ${KIND_WORDS[s.kind] ?? 'one part of this module'}.`) : null,
      note?.seeing ? req(say(note.seeing, s)) : null,
      rack
        ? req('Above, the drawing; the line under it says how to read it and what it simplifies.')
        : s && s.kind !== 'READ'
          ? opt('A reading step: words and still drawings, no live display.')
          : null,
      rack && s && s.bezel.length ? opt(`Bezel readouts: ${s.bezel.join(', ')}.`) : null,
      sameAsStage ? null : opt(`It belongs to the journey’s ${stage.title.toUpperCase()} stage.`),
      x.first ? opt(`At the top, “Page ${x.pageNum} goal:” says what this module asks.`) : null,
      x.last ? opt(x.credited ? 'At the end, the takeaway card, then “This page is credited.”' : 'At the end, the takeaway card and the TO EARN CREDIT line.') : null,
    ],
    SCREEN_GUIDE_BUDGET.low,
  );

  // ── WHAT YOU CONTROL ──
  const dockLine = (level: 0 | 1 | 2) => (s && s.dock.length ? `The dock: ${s.dock.map((k) => keyPhrase(k, level)).join('; ')}.` : '');
  const hasPos = !!s && s.dock.some((k) => k.label === 'POSITION' && k.kind === 'fader');
  // "Nothing to set" only for a known read step whose every copy holds no
  // card to answer (the notes without a control line); a family's unknown
  // read step, or any PRACTICE step, may hold answer cards.
  const readControl = s && !rack
    ? s.kind === 'CHECK'
      ? 'Tap an answer. A wrong pick says why — choose again; the end screen notes your first try.'
      : note?.control
        ? ''
        : note && s.kind !== 'PRACTICE'
          ? 'Nothing to set on this step: read it, then NEXT ›.'
          : s.kind === 'PRACTICE'
            ? 'Answer each card on this step; a wrong pick says why — choose again.'
            : 'Read it, answer any card it holds, then NEXT ›.'
    : '';
  const controlFor = (level: 0 | 1 | 2) =>
    fit(
      [
        rack ? req(dockLine(level) || 'No dock keys on this step: the drawing is for looking.') : null,
        note?.control ? req(say(note.control, s)) : null,
        readControl ? req(readControl) : null,
        hasPos ? opt('Drag the mic on the display, or use POSITION and AIM to do the same with no drag; a part in the way stops it, named with ✕.') : null,
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
      req(stageChanges[0]),
      ...stageChanges.slice(1).map(opt),
      rack ? opt('A dock change shows on the drawing, the bezel or the words under it — silently: the lab plays no sound.') : null,
    ],
    SCREEN_GUIDE_BUDGET.low,
  );

  // ── WHAT THIS TEACHES ──
  const seq = sequenceLine(x.prevTitle, x.nextTitle);
  const goalLine = `This module’s goal: ${x.goal}`;
  const teaches = fit(
    [
      req(goalLine.length + seq.length + 1 <= SCREEN_GUIDE_BUDGET.low ? goalLine : x.goal),
      req(seq),
      opt(words.teaches),
      x.page === 'microphone' ? opt('Microphone Principles, in Audio Fundamentals, covers pickup patterns in depth.') : null,
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
    if (fader) tries.push(`Slide ${fader.label} from one end to the other and watch what changes on the drawing and the bezel.`);
    if (choice && tries.length < 3) tries.push(`Open ${choice.label} and try each choice in turn, watching what changes.`);
    if (toggle && tries.length < 3) tries.push(`Tap ${toggle.label} and compare the two states.`);
    if (tries.length < 2) tries.push('Open ⤢ FULL SCREEN and zoom in on the part this step is about.');
  }
  if (s && !rack && s.kind === 'CHECK' && tries.length < 2) tries.push('Answer the card you are least sure of first: a wrong pick shows its reason, and you choose again.');
  if (tries.length < 2) tries.push(isDefault ? sharp!.tryThis : words.tryThis);
  if (tries.length < 2) tries.push('Use the middle readout in the strip to see every step of this module, and jump to one.');
  const tryThis = tries.slice(0, 3);

  return { seeing, control, changes, teaches, tryThis };
}

// ═══ THE FOUNDATIONS CARD (journeyKit.FoundationsCard) ═══════════════════

/** In place of a module's activity until the first two modules are met. */
export function mikingFoundationsGuide(x: { pageNum: number; pageTitle: string; prevTitle: string | null; nextTitle: string | null }): ScreenGuide {
  return {
    seeing: [
      `MODULE ${x.pageNum} · ${x.pageTitle.toUpperCase()}, showing BUILT ON THE FIRST TWO PAGES in place of its activity.`,
      'The first two modules are listed: ✓ when done, or ○ with an OPEN button.',
    ],
    control: [
      'OPEN jumps to that module.',
      'The QUICK CHECK button (I ALREADY MIC …) sets the quick-check path and opens the first module, where the check is.',
      STRIP_LINE,
      CHIP_LINE,
    ],
    changes: [
      'Finishing one of the first two modules counts at once on screen, so this activity opens even before anything is saved.',
      'A passed quick check opens every activity but credits nothing: the first two modules still earn their own credit.',
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
  seeing: [
    'The end of the lesson: LAB COMPLETE when every module is done, else WHAT’S LEFT with a row for each module still to do — its requirement and any first-try note.',
    'REVIEW ▾ opens the modules already done.',
  ],
  control: [
    'Tap a row to jump straight to that module.',
    'PRACTICE AGAIN FROM THE START begins a fresh practice run at the first module; DONE · BACK TO LABS leaves the lesson.',
    '‹ PREV returns to the module you came from, just as you left it.',
    CHIP_LINE,
  ],
  changes: [
    'A module is done when its own requirement is met — its checks answered right, its activity finished; one with neither is done when you move on.',
    'A fresh practice run clears answers and activities; modules already done stay done.',
  ],
  teaches: [
    'The lesson’s journey, in order: where the sound leaves, starting setups, the microphones, the Placement Studio, the advanced modules and practice.',
    'Next: another lesson in this family, from its list of lessons.',
  ],
  tryThis: [
    'Jump to a module whose row has a first-try note and re-read its checks: each right answer and its reason stay shown. A fresh practice run lets you answer them again.',
    'Start a fresh practice run and choose the quick-check path on the first module: see whether the foundations hold.',
  ],
};

// ═══ THE FAMILY HUB (MikingHubScreen) ════════════════════════════════════

/** The hub's guide: one family's lessons (the Labs menu tile), or every
 *  family in turn when no family is named. */
export function mikingHubGuide(family?: { family: string }): ScreenGuide {
  const where = family ? `${family.family.toUpperCase()}: one tile per lesson in this family` : 'MIKING LABS: every family’s lessons, a heading for each family';
  return {
    seeing: [
      `${where}, under a line on what the lessons cover.`,
      'Each tile: the lesson’s name, what it covers, and how many of its modules are done (the tile calls them pages); ✓ marks a finished lesson.',
      'At the bottom, a reminder: these lessons suggest where to begin — starting points, not rules.',
    ],
    control: [
      'Tap a tile to open that lesson (where you left off, when your progress is saved).',
      '‹ goes back to the Labs menu.',
    ],
    changes: [
      'A tile’s count grows as that lesson’s modules are done; practicing again never lowers it.',
      'If progress cannot be read, the count shows “—” and a note says so; every lesson still opens.',
    ],
    teaches: [
      'Every lesson follows one journey: where the sound leaves, real starting setups, the microphones, the Placement Studio, advanced situations and practice — silent, in drawings.',
      'In Instruments & Recording these follow the Microphone Selection Lab; Microphone Principles, in Audio Fundamentals, covers patterns and distance.',
    ],
    tryThis: [
      'Open a lesson and look at its first step’s journey map: the same stages run through every lesson here.',
      'Finish a module, come back, and find that tile’s count has grown (when your progress is saved).',
    ],
  };
}
