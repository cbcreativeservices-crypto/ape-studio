/**
 * Audio Calculator Laboratory — "explain this screen" content (Screen Guide
 * rollout, 2026-10-31). Pattern: src/screens/lab/wave/waveScreenGuides.ts.
 *
 * Screens the learner reaches, one guide each:
 *   home            CalcLabScreen — the ten category tiles, workflows, chain
 *   workspace       CalcWorkspaceScreen — BUILT per calculator and per
 *                   calculation (calcWorkspaceGuide below): 56 calculator pages ×
 *                   166 calculators share one screen, so the guide quotes that
 *                   calculator's own on-screen names (its FUNCTION, its INPUTS,
 *                   its FORMULA) from the registry data, and its TRY THIS
 *                   numbers come from the screen's own compute path (see
 *                   CalcGuideExample) — never typed by hand
 *   symbols         CalcSymbolsKeyScreen
 *   workflows       CalcWorkflowsScreen
 *   workflowEdit    CalcWorkflowEditScreen
 *   workflowRun     CalcWorkflowRunScreen — a step
 *   workflowResults CalcWorkflowRunScreen — the finished report
 *   projects        CalcProjectsScreen — the list
 *   projectEdit     CalcProjectsScreen — the editor
 *   results         CalcResultsScreen
 *
 * Calculators keep the ✓ VERIFIED chip (AccuracyNote variant "calc"); the ⓘ
 * key sits beside it. Copy never suggests the maths is untrustworthy: each
 * result is computed exactly from the formula shown.
 *
 * Budgets: SCREEN_GUIDE_BUDGET (types.ts) — test/screenGuide_calc_20261031
 * runs the builder over every calculation and holds each step to it.
 * Copy rules: plain language; KNOWLEDGE, never skills; no "N of total";
 * "suggest", never "recommend"; no gear brands; no build notes.
 */
import { SCREEN_GUIDE_BUDGET, type ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { CalcFunction, Workspace } from './calcTypes';
import { chainFits, type QuantityKind } from './calcUnits';
import { WORKSPACES } from './registry';

/** The first number YOUR ANSWER shows when every input holds its grey example
 *  value (the field's placeholder) — computed by CalcWorkspaceScreen with the
 *  SAME buildValues / runCompute / formatOutput the answer itself uses, so a
 *  TRY THIS number is exactly what the screen prints. */
export type CalcGuideExample = {
  /** The output's on-screen label. */
  label: string;
  /** As shown at the starting 4 SIG FIGS. */
  at4: string;
  /** As shown at 5 SIG FIGS. */
  at5: string;
  /** As shown after one tap on the number (next unit), or null (one unit). */
  next: string | null;
  /** The same tap at 5 SIG FIGS, or null (one unit). */
  at5Next: string | null;
  /** SEND → shows beside it. */
  sendable: boolean;
  /** Where a SENT value can be used (calcSendTarget). */
  sendTo: CalcSendTarget;
  /** ▸ WORKED STEPS shows under the answer. */
  steps: boolean;
  /** The widest reach of ANY SEND → this answer shows (calcSendReach over
   *  every output): 'other', 'here', or null when no SEND → appears at all. */
  sendAny: CalcSendTarget;
};

/** 'other' — an input in another calculator takes it; 'here' — only another
 *  calculation of this calculator does; null — no input anywhere does. */
export type CalcSendTarget = 'other' | 'here' | null;

/** Where ⤵ USE would offer a value SENT from `fn`: the screen's own offer rule
 *  (chainFits, as CalcWorkspaceScreen's INPUTS use it) run over every
 *  calculator's inputs, this calculation's own excepted. `meaning` is the
 *  answer's own tag (D41): an input takes it only when the meaning matches. */
export function calcSendTarget(ws: Workspace, fn: CalcFunction, label: string, quantity: QuantityKind, meaning?: string): CalcSendTarget {
  let here = false;
  for (const w of WORKSPACES) {
    for (const g of w.functions) {
      if (w.id === ws.id && g.key === fn.key) continue;
      for (const k of g.inputs) {
        const f = w.fields.find((x) => x.key === k);
        if (!f || !chainFits(label, quantity, f, meaning)) continue;
        if (w.id !== ws.id) return 'other';
        here = true;
      }
    }
  }
  return here ? 'here' : null;
}

/** Where the SEND → buttons on this answer can reach, over EVERY output —
 *  the screen's own rule (CalcWorkspaceScreen sendTakers + its render gate):
 *  SEND → shows beside a finite, chainable value that calcSendTarget finds a
 *  taker for. 'other' if any reaches another calculator, else 'here' if any
 *  reaches another calculation of this one, else null (no SEND → shows). */
export function calcSendReach(
  ws: Workspace,
  fn: CalcFunction,
  outputs: readonly ({ label: string } & Partial<{ value: number; quantity: QuantityKind; chainable: boolean; meaning: string }>)[],
): CalcSendTarget {
  let here = false;
  for (const o of outputs) {
    if (typeof o.value !== 'number' || !Number.isFinite(o.value) || o.chainable === false || !o.quantity) continue;
    const t = calcSendTarget(ws, fn, o.label, o.quantity, o.meaning);
    if (t === 'other') return 'other';
    if (t === 'here') here = true;
  }
  return here ? 'here' : null;
}

/** The number at the front of a shown value ("29.997 m" → "29.997"). */
const numPart = (s: string) => /^-?[\d.]+(?:e[+-]?\d+)?/.exec(s.trim())?.[0] ?? '';
/** Its significant figures (sign, point and leading zeros dropped). */
const sigCount = (s: string) =>
  numPart(s)
    .replace(/e.*$/, '')
    .replace(/[-.]/g, '')
    .replace(/^0+/, '').length;
/** A unit tap worth showing a beginner: no exponent form, under a million. */
const plainShown = (s: string) => !/\de[+-]?\d/.test(s) && (/^-?(\d+)/.exec(numPart(s))?.[1].length ?? 0) < 6;

/** The guide card's title for a calculator. */
export function calcWorkspaceGuideTitle(ws: Workspace): string {
  return ws.name.toUpperCase();
}

/** The guide for one calculator, on the calculation currently picked.
 *  `capped` is the screen's own flag (a free or lapsed account, whose answer
 *  waits behind CALCULATE): only those readers get the CALCULATE lines. */
export function calcWorkspaceGuide(ws: Workspace, fn: CalcFunction, ex: CalcGuideExample | null, capped = false): ScreenGuide {
  const fields = fn.inputs.map((k) => ws.fields.find((f) => f.key === k)).filter((f): f is NonNullable<typeof f> => !!f);
  const names = fields.map((f) => f.name).join(', ');
  const n = ws.functions.length;
  const picker =
    n > 1
      ? `WHAT ARE YOU CALCULATING? (below the inputs) picks one of this page’s ${n} calculations, each with its own inputs and formula.`
      : 'WHAT ARE YOU CALCULATING? (below the inputs) shows this page’s one calculation.';

  const tryThis: string[] = [];
  if (ex) {
    const stepsLine = 'Open ▸ WORKED STEPS under the answer and follow the example numbers through the formula, one line at a time.';
    const unitLine = (shown: string, next: string) => `Tap ${shown} itself: it now reads ${next}, the same quantity in another unit.`;
    tryThis.push(`Type the gray example value into each box (then CALCULATE, if it shows): ${ex.label} reads ${ex.at4}.`);
    let usedSig = false;
    let usedUnit = false;
    let usedSteps = false;
    if (ex.at5 !== ex.at4) {
      usedSig = true;
      // "One more figure" only when the 5-figure number visibly extends the
      // 4-figure one (3.432 → 3.4321); 30 → 29.997 is the value 4 figures
      // rounded, and the line says so.
      const oneMore = sigCount(ex.at5) === sigCount(ex.at4) + 1 && numPart(ex.at5).startsWith(numPart(ex.at4));
      tryThis.push(
        oneMore
          ? `Tap SIG FIGS to 5: ${ex.label} now reads ${ex.at5}, the same answer with one more figure.`
          : `Tap SIG FIGS to 5: ${ex.label} now reads ${ex.at5}. It’s the same answer: at 4 figures it rounds to ${ex.at4}.`,
      );
    } else if (ex.next && plainShown(ex.next)) {
      usedUnit = true;
      tryThis.push(unitLine(ex.at4, ex.next));
    } else if (ex.steps) {
      usedSteps = true;
      tryThis.push(stepsLine);
    }
    // After SIG FIGS 5 the answer reads at5, so its unit tap is at5 → at5Next.
    const unitAfter: [string, string] | null = usedSig
      ? ex.at5Next
        ? [ex.at5, ex.at5Next]
        : null
      : ex.next
        ? [ex.at4, ex.next]
        : null;
    if (ex.sendable && ex.sendTo === 'other') {
      tryThis.push(`Tap SEND → beside ${ex.label}, then open another calculator: a matching input offers ⤵ USE ${ex.label}.`);
    } else if (ex.sendable && ex.sendTo === 'here') {
      tryThis.push(`Tap SEND → beside ${ex.label}, then pick another calculation under WHAT ARE YOU CALCULATING? An input there offers ⤵ USE ${ex.label}.`);
    } else if (!usedUnit && unitAfter && plainShown(unitAfter[1])) {
      tryThis.push(unitLine(unitAfter[0], unitAfter[1]));
    } else if (ex.steps && !usedSteps) {
      tryThis.push(stepsLine);
    }
    if (tryThis.length < 2) tryThis.push('Change one input and watch which results move. Then open π KEY to see why the formula moves them.');
  } else {
    tryThis.push('Type the gray example value into each box (then CALCULATE, if it shows) and read each line of YOUR ANSWER.');
    tryThis.push('Change one input and watch which results move. Then open π KEY to see why the formula moves them.');
  }

  // The INPUTS line names this calculation's inputs; a list long enough to push
  // the step past its budget drops the names (they are on the screen anyway).
  const inputsAt = fields.length ? `Under INPUTS (${names}), ` : 'Under INPUTS, ';
  const inputsLine = (at: string) =>
    fields.some((f) => f.quantity === 'list')
      ? `${at}a list box takes several numbers separated by commas. Gray text in an empty box is an example.`
      : fields.length === 1
        ? `${at}type a number. A gray number in an empty box is an example value.`
        : `${at}type a number in each box. A gray number in an empty box is an example value.`;
  const controlRest = [
    'Tap ⇄ to switch a box’s unit and ⓘ to see what an input means. A ⚠ under a box flags a value worth a second look.',
    picker,
    'In the answer, tap a number to see another unit. SEND → (if an input takes it) passes it on. SHARE / COPY RESULT sends the report. SIG FIGS cycles 3, 4, 5.',
  ];
  if (capped) controlRest.push('On this account, CALCULATE shows each new answer and uses one of this week’s calculations; an input error costs nothing.');
  const named = inputsLine(inputsAt);
  const control = [
    [named, ...controlRest].join(' ').length <= SCREEN_GUIDE_BUDGET.high ? named : inputsLine('Under INPUTS, '),
    ...controlRest,
  ];

  // WHY the answer moves: the calculation's formula in words (its π KEY
  // text) — in WHAT CHANGES while that step still fits, else in WHAT THIS
  // TEACHES in place of the π KEY pointer, else the formula alone. Each step
  // takes the first wording that fits its budget; the shorter fallbacks keep
  // a long formula or name on one screen.
  const fits = (lines: string[]) => lines.join(' ').length <= SCREEN_GUIDE_BUDGET.low;
  const firstFit = (options: string[][]) => options.find(fits) ?? options[options.length - 1];
  const moves = capped
    ? 'New inputs wait until you tap CALCULATE (one more of this week’s calculations); ▸ WORKED STEPS shows your numbers in the formula.'
    : 'Change any input and every result updates at once; ▸ WORKED STEPS puts your numbers into the formula.';
  const noAnswer = 'If your inputs have no answer (a zero, or a pair in the wrong order), you see words saying what is wrong instead of a number.';
  const noAnswerShort = 'If your inputs have no answer, you see words saying what is wrong instead of a number.';
  const formulaLine = `Your answer comes from this formula: ${fn.formula}`;
  // A formula that already ends in a full stop takes no second one.
  const withWords = fn.plainFormula ? `${formulaLine.replace(/\.$/, '')}. In words: ${fn.plainFormula}` : formulaLine;
  const changes = firstFit([
    ...(fn.plainFormula ? [[withWords, moves, noAnswer], [withWords, moves, noAnswerShort]] : []),
    [formulaLine, moves, noAnswer],
    [formulaLine, moves, noAnswerShort],
  ]);
  const wordsInChanges = !!fn.plainFormula && changes[0] === withWords;
  const scroll = 'Scroll down: WHY THIS MATTERS, PRACTICAL EXAMPLE and COMMON MISTAKES show where this number turns up in real work and where people get it wrong.';
  const scrollShort = 'Scroll down: WHY THIS MATTERS, PRACTICAL EXAMPLE and COMMON MISTAKES tie this number to real work.';
  // The SEND line only where a SEND → can show (audit K4, D42): the chain line
  // when an answer reaches another calculator, a this-page line when only
  // another calculation here takes it, and nothing when no SEND → appears.
  const send: string[] = [];
  if (ex?.sendAny === 'other') send.push('Real system design is a chain: one answer feeds the next calculation, and SEND → carries it into another calculator.');
  else if (ex?.sendAny === 'here') send.push('One answer can feed another: SEND → passes it to another calculation on this page, but only to an input of the same kind.');
  const teachWords = `How each input moves “${fn.name}”: ${fn.plainFormula ?? ''}`;
  // The π KEY pointer, with its reason while the step still fits, else without.
  const piWhy = `What “${fn.name}” works out, and how each input moves it. π KEY reads the formula in plain English, so you can see which input matters most.`;
  const piPlain = `What “${fn.name}” works out, and how each input moves it. π KEY reads the formula in plain English.`;
  const teaches = firstFit([
    ...(!wordsInChanges && fn.plainFormula ? [[teachWords, scroll, ...send], [teachWords, scrollShort, ...send]] : []),
    [piWhy, scroll, ...send],
    [piPlain, scroll, ...send],
    [piPlain, scrollShort, ...send],
  ]);

  return {
    intro: {
      learning: `What “${fn.name}” works out, and how each input moves the answer through its formula.`,
      start: ex
        ? `Type the gray example value into each box (then CALCULATE, if it shows): ${ex.label} reads ${ex.at4}. Then change one input and watch which results move.`
        : 'Type the gray example value into each box (then CALCULATE, if it shows) and read each line of YOUR ANSWER.',
    },
    seeing: [
      'YOUR ANSWER sits at the top and stays in view while you type below. It fills in once every input has a value.',
      `Just under it: FUNCTION (“${fn.name}”), SIG FIGS (how many figures show) and FORMULA π KEY.`,
      'Below the inputs: WHAT ARE YOU CALCULATING?, the FORMULA line, WHY THIS MATTERS, PRACTICAL EXAMPLE, COMMON MISTAKES and IN THE GLOSSARY.',
    ],
    control,
    changes,
    teaches,
    tryThis,
  };
}

export type CalcScreenId =
  | 'home'
  | 'symbols'
  | 'workflows'
  | 'workflowEdit'
  | 'workflowRun'
  | 'workflowResults'
  | 'projects'
  | 'projectEdit'
  | 'results';

export const CALC_SCREEN_GUIDES: Record<CalcScreenId, ScreenGuide> = {
  // ── CalcLabScreen ─────────────────────────────────────────────────────────
  home: {
    intro: {
      learning: 'How the everyday numbers of audio work — level, distance and time, power, rooms, digital — come from short formulas, and how one answer can feed the next.',
      start: 'Tap WAVES & TIME, open Sound & Wave and type 100 in FREQUENCY (then CALCULATE, if it shows). PERIOD reads 10 ms. Then tap π KEY and find λ (lambda).',
    },
    seeing: [
      'Every calculator sits in one of ten category tiles, from WAVES & TIME to ELECTRONICS; each tile shows how many CALCULATORS it holds.',
      'Up top: ▸ CUSTOM CALCULATOR WORKFLOWS and ▾ ABOUT THIS LAB. ⛓ CHAIN ACTIVE shows while a result you sent waits to be used.',
      'π KEY opens the SYMBOL KEY; ✓ opens VERIFIED CALCULATION, how each result is computed. OPEN CALCULATORS on Home brings you back here.',
    ],
    control: [
      'Tap a category tile to see its calculators in a popup, grouped by job. Tap one to open it; tap ✕ or outside the popup to close it.',
      'Tap ▸ CUSTOM CALCULATOR WORKFLOWS for ＋ NEW WORKFLOW, MY WORKFLOWS & TEMPLATES ›, SAVED PROJECTS ›, SAVED RESULTS › and your last workflow under RECENT · TAP TO RUN.',
      'When ⛓ CHAIN ACTIVE shows, tap ✕ CLEAR to drop the result you sent.',
      'Tap π KEY to look up the Greek letters and math symbols the calculators use.',
    ],
    changes: [
      'When one job can be worked out several ways, those calculators share a page. Pick yours under WHAT ARE YOU CALCULATING? and the inputs change to match.',
      'You can SEND a result into another calculator, so one answer feeds the next: sensitivity → voltage → gain → headroom.',
      'A workflow runs several calculators in order and carries each answer forward for you.',
    ],
    teaches: [
      'The math behind everyday audio work (levels, distance, power, rooms, digital) comes from a few short formulas.',
      'The reasoning matters as much as the result: each calculator’s FORMULA, WORKED STEPS, WHY THIS MATTERS, PRACTICAL EXAMPLE and COMMON MISTAKES show why a number is right.',
      'Real system design is a chain: one answer feeds the next, from sensitivity to voltage, then gain, then headroom.',
    ],
    tryThis: [
      'Open WAVES & TIME › Sound & Wave and type 100 in FREQUENCY (then CALCULATE, if it shows). PERIOD reads 10 ms: one cycle of a 100 Hz tone.',
      'Open LEVELS & DECIBELS › Audio Level Converter and type 4 in LEVEL (dBu) (then CALCULATE, if it shows). VOLTAGE (RMS) reads 1.228 V: +4 dBu pro line level.',
      'Tap π KEY and find λ (lambda): wavelength, the length of one cycle. λ = c / f, so the higher the frequency, the shorter the wave.',
    ],
  },

  // ── CalcSymbolsKeyScreen ──────────────────────────────────────────────────
  symbols: {
    intro: {
      learning: 'How to read the formulas behind audio math: what each Greek letter and symbol stands for, and how prefixes like µ, m and k scale a unit.',
      start: 'Find λ under GREEK LETTERS and tap it to read Wavelength in the glossary. Then find µ and see what it does to a unit as a prefix.',
    },
    seeing: [
      'This is the SYMBOL KEY: every Greek letter and math symbol the calculators use, sorted into groups.',
      'The groups: GREEK LETTERS, OPERATORS & RELATIONS, CALCULUS & LOGARITHMS, POWERS, SUBSCRIPTS & PREFIXES, COMMON VARIABLES, VALUES THAT KEEP TURNING UP.',
      'Each row gives the symbol, its name and what it means in audio math, often with a formula where you’ll meet it.',
    ],
    control: [
      'Scroll to browse the groups.',
      'Tap a row marked ⓘ TAP FOR GLOSSARY DEFINITION to read that term right here; close it to come back to the key.',
      'Tap ‹ to go back where you came from: the lab home, or the calculator whose FORMULA KEY you left through π OPEN THE FULL SYMBOL KEY ›.',
    ],
    changes: [
      'Nothing here calculates. This is the dictionary for the formulas.',
      'Letters keep a formula short: λ = c / f reads “wavelength equals the speed of sound divided by the frequency.”',
      'Some symbols have two jobs, and their row names both: ρ is resistivity for a cable, or the density of air.',
      'A calculator’s own π KEY lists only the symbols in its formula; this screen holds them all.',
    ],
    teaches: [
      'A formula is a sentence in short form: once you know each letter, you can read it aloud and see what moves the answer.',
      'Prefixes scale a unit: µ is one-millionth, m one-thousandth, k a thousand.',
      'A few symbols turn up everywhere: π, Δ (a change), λ (wavelength) and Ω (ohms).',
    ],
    tryThis: [
      'Find λ under GREEK LETTERS and tap it: the glossary entry for Wavelength opens right here.',
      'Find Δ: a change, or the difference between two values. Then open the Phase & Time Offset calculator and spot it in TIME OFFSET Δt.',
      'Find µ. As a prefix it means one-millionth, so 10 µF is 0.00001 F.',
    ],
  },

  // ── CalcWorkflowsScreen ───────────────────────────────────────────────────
  workflows: {
    intro: {
      learning: 'How a real audio design job chains calculations in order: in a room survey, RT60 comes first, then critical distance, then the direct-to-reverberant ratio.',
      start: 'Tap ▶ RUN on the Room Acoustics Survey template and fill in step 1. On step 2, look for ⤵ USE RT60 (STEP 1).',
    },
    seeing: [
      'CALCULATOR WORKFLOWS are guided sequences that run several calculators in order.',
      'Under MY WORKFLOWS are the ones you saved; each card lists its numbered steps.',
      'Under WORKFLOW TEMPLATES are built-in sequences, such as Delay Speaker Setup and Room Acoustics Survey. A gold ★ marks a favorite.',
    ],
    control: [
      'Tap ▶ RUN to start a workflow; each step is one calculator.',
      'On a template, tap DUPLICATE & CUSTOMIZE to make your own copy and open it in the builder.',
      'On your own workflows: EDIT, DUPLICATE, DELETE (it asks first, and your saved results are kept), and ▲ ▼ to reorder the list.',
      'Tap ＋ NEW (top right) for an empty builder, and ★ to add or remove a favorite.',
    ],
    changes: [
      'Each step uses one of the lab’s own calculators, with the same formula as on its own page.',
      'During a run, a later step is offered an earlier answer only when it means the same thing: an RT60 fills an RT60, but a voltage drop never fills a supply voltage.',
      'Templates can’t be changed, so your edits always go into your own copy.',
    ],
    teaches: [
      'A design job is a chain of calculations: in a room survey, RT60 comes first, then critical distance, then the direct-to-reverberant ratio. It’s one job, not three.',
      'Order matters: you can’t work out a value before you have the numbers it depends on.',
      'Same unit isn’t same meaning: the voltage lost along a cable is not the voltage your supply delivers.',
    ],
    tryThis: [
      'Tap ▶ RUN on Room Acoustics Survey and fill in step 1. On step 2, look for ⤵ USE RT60 (STEP 1): the RT60 you just worked out, ready to use.',
      'Tap DUPLICATE & CUSTOMIZE on a template: your copy opens in the builder with “copy” added to its name.',
    ],
  },

  // ── CalcWorkflowEditScreen ────────────────────────────────────────────────
  workflowEdit: {
    intro: {
      learning: 'How to break an audio job into a chain of calculations, and why each step must come after the steps that produce the values it needs.',
      start: 'Type a WORKFLOW NAME, tap ＋ ADD CALCULATOR and add Power from voltage & impedance, then Current from power & voltage. Tap SAVE.',
    },
    seeing: [
      'This is the builder: NEW WORKFLOW, or EDIT WORKFLOW when you change one you saved.',
      'At the top: WORKFLOW NAME and DESCRIPTION (OPTIONAL).',
      'Under STEPS, the calculators in run order. Each shows its number, its calculation and its calculator’s name, plus a box for a short instruction you’ll see while it runs.',
    ],
    control: [
      'Tap ＋ ADD CALCULATOR to list every calculation. Type in Search calculators to narrow the list, then tap one to add it as the last step.',
      'Tap ▲ or ▼ to move a step up or down, and ✕ to remove it.',
      'Tap SAVE (top right) to store the workflow. If you leave with unsaved changes, you’re asked “Discard changes?” first.',
    ],
    changes: [
      'Step order is run order. A step can use answers only from the steps before it, so put the step that produces a value first.',
      'A step is offered only answers that mean the same thing as its input: a power fills a power, but a calculated RT60 never fills a target RT60. Where nothing fits, type it.',
      'A saved workflow runs again with new numbers any time.',
    ],
    teaches: [
      'A bigger audio question breaks into small calculations, each feeding the next: voltage and impedance give you power, and power and voltage give you current.',
      'The right unit can still be the wrong quantity: a target RT60 is the decay time you’re aiming for, not one the room already has.',
    ],
    tryThis: [
      'Name it, add Power from voltage & impedance, then Current from power & voltage, and SAVE. Run it, fill in step 1, and step 2 offers ⤵ USE POWER (STEP 1).',
      'Tap ▲ on the last step: it moves up, and the step numbers follow the new order.',
    ],
  },

  // ── CalcWorkflowRunScreen — a step ────────────────────────────────────────
  workflowRun: {
    intro: {
      learning: 'How one calculation’s answer becomes the next one’s input, and why an answer may only fill an input that means the same thing.',
      start: 'In the Ohm’s Law template, type 40 in VOLTAGE (RMS) and 8 in IMPEDANCE on step 1. Read POWER and CURRENT, then tap CONTINUE ›.',
    },
    seeing: [
      'At the top: the workflow’s name, with this step’s calculation under it.',
      'The step buttons run from Step 1 to RESULTS. The current one is lit; finished steps are marked done.',
      'Below: this step’s inputs (with any instruction above them), then YOUR ANSWER and the FORMULA it uses.',
    ],
    control: [
      'Type values as in any calculator: ⇄ switches a unit, ⓘ explains an input, and tapping an answer number changes its unit.',
      '⤵ USE … (STEP n) fills an input with an earlier step’s answer that means the same thing. Type over it and it’s marked Manually overridden; ⟲ RESTORE IMPORT brings it back. If a saved import no longer fits, it says so: type a value.',
      '⛭ USE A SAVED PROJECT (when you have one) attaches a project, so its values offer ⤵ USE … (PROJECT) on inputs of the same kind.',
      '‹ PREVIOUS and CONTINUE › move between steps (FINISH ✓ on the last). Tap a step button to jump. SAVE, where it shows, keeps your progress.',
    ],
    changes: [
      'Each step works exactly as its calculator does on its own page.',
      'Change a value a later step used, and that later result recalculates; a ↻ note says how many changed.',
      'An answer is offered only where it means the same thing: a distance never fills a time, and a voltage drop never fills a supply voltage. If nothing earlier fits, type the value.',
    ],
    teaches: [
      'In system design, one answer becomes the next input: the power from step 1 is what step 2 turns into current.',
      'Two routes to the same quantity must agree: 40 V across 8 Ω and 200 W at 40 V both give 5 A.',
      'Knowing where each number came from lets you trace a mistake: an imported input shows its source, such as “From … (step 1)”.',
    ],
    tryThis: [
      'In the Ohm’s Law template, type 40 in VOLTAGE (RMS) and 8 in IMPEDANCE on step 1: POWER reads 200 W and CURRENT reads 5 A.',
      'Then CONTINUE ›. On step 2, tap ⤵ USE POWER (STEP 1) and type 40 in VOLTAGE (RMS): CURRENT reads 5 A, the same current worked out from the power.',
    ],
  },

  // ── CalcWorkflowRunScreen — the finished report ───────────────────────────
  workflowResults: {
    intro: {
      learning: 'How a calculation is documented on the job: what went in, where each number came from, what came out, and which warnings apply.',
      start: 'Read PRIMARY RESULT, then INPUTS and RESULTS, and any WARNINGS. Type a line in YOUR NOTES and tap SAVE RESULT.',
    },
    seeing: [
      'This is the finished report: PRIMARY RESULT, INPUTS, RESULTS, then any NOTES and WARNINGS, ending with its Report ID.',
      'YOUR NOTES is a box for your own words. They go into the report when you save or share it.',
    ],
    control: [
      'Tap SAVE RESULT to store the report in SAVED RESULTS; it reads SAVED ✓ once stored.',
      'Tap SHARE AS TEXT to send it as plain text, or SHARE AS IMAGE, where it shows, to send a picture of the report.',
      'Tap START AGAIN to clear the inputs for a fresh run of the same workflow, or tap a step button above to go back to a step.',
    ],
    changes: [
      'The report uses each step’s answer as it stood when you tapped FINISH ✓.',
      'Type in YOUR NOTES and SAVED ✓ turns back into SAVE RESULT, so you always know whether your latest words are stored.',
    ],
    teaches: [
      'On the job, a figure is only useful if someone can check it: a calculation is documented by what went in, where it came from and what came out.',
      'The warnings travel with the result, so whoever uses the number also knows its limits.',
    ],
    tryThis: [
      'Type a line in YOUR NOTES: SAVED ✓ turns back into SAVE RESULT until you save again.',
      'Tap SHARE AS TEXT: the whole report goes out as text, ready for an email or a message.',
    ],
  },

  // ── CalcProjectsScreen — the list ─────────────────────────────────────────
  projects: {
    intro: {
      learning: 'Why a venue’s fixed numbers — room size, temperature, distances — are worth storing once, with their units, and reusing for every calculation in that room or rig.',
      start: 'Tap ＋ NEW, name the project, add a value labeled Listener distance as Length / distance, type 12, and SAVE.',
    },
    seeing: [
      'SAVED PROJECTS holds reusable values for one venue or rig: room dimensions, temperature, listener distance, impedance, target SPL.',
      'Each card shows the project’s name, its notes and the labels of the values it holds.',
    ],
    control: [
      'Tap ＋ NEW (top right) to start a project, EDIT to open one, or DELETE to remove it (it asks first).',
      'To use a project, run a workflow and tap ⛭ USE A SAVED PROJECT to attach it.',
    ],
    changes: [
      'A project changes only when you edit it here. Running a workflow never writes back into it.',
      'A project value is offered only to an input of the same kind: a power never fills a voltage. Check it’s the same thing before you tap ⤵ USE.',
    ],
    teaches: [
      'A venue’s fixed numbers (room size, temperature, distances) can be stored once with their units and reused for every plan in that room or rig.',
      'Temperature belongs with them: sound travels faster in warm air, so delay times and wavelengths shift with it.',
    ],
    tryThis: [
      'Tap ＋ NEW, name it, add a value labeled Listener distance as Length / distance, type 12, and SAVE.',
      'Run a workflow, attach the project, and look for ⤵ USE … (PROJECT) under a distance input.',
    ],
  },

  // ── CalcProjectsScreen — the editor ───────────────────────────────────────
  projectEdit: {
    intro: {
      learning: 'Why every number in audio needs its kind and its unit: 10 alone means nothing, but 10 m and 10 Ω are different things.',
      start: 'Type a PROJECT NAME and tap ＋ ADD VALUE. Give the value a label, tap its type button (marked ⇄) until it reads Length / distance, type a number, and SAVE.',
    },
    seeing: [
      'This is NEW PROJECT, or EDIT PROJECT for one you saved: PROJECT NAME, NOTES (OPTIONAL) and VALUES.',
      'Each value row holds a label, its type (such as Length / distance), a number and a unit.',
    ],
    control: [
      'Type a label. Tap the type button (marked ⇄) to step through Length / distance, Temperature, SPL, Power, Impedance and the rest. Tap the unit button to switch units.',
      'Tap ＋ ADD VALUE to add a row and ✕ to remove one.',
      'Tap SAVE (top right) to store the project. Tapping ‹ with unsaved changes asks “Discard changes?” first.',
    ],
    changes: [
      'Change a value’s type and its number clears: a number only means something with its kind and unit.',
      'Rows without a label or a valid number are skipped on save.',
      'Each value is stored once, so a workflow can show it in whatever unit its input uses.',
    ],
    teaches: [
      'Every number in audio needs its kind and its unit: 10 alone means nothing, and 10 m and 10 Ω are different things.',
      'Changing a unit label is not converting: 20 m and 20 ft are very different distances, so the unit must match how the number was measured.',
    ],
    tryThis: [
      'Add a value, type 20, then tap its type button: the type moves on and the number clears.',
      'Give a Length / distance value 20, then tap its unit button: m becomes ft and the number stays, so 20 m is now 20 ft, a different length. Pick the unit your number is in.',
    ],
  },

  // ── CalcResultsScreen ─────────────────────────────────────────────────────
  results: {
    intro: {
      learning: 'Why a saved record of a calculation matters: it shows how a figure was reached, long after the job is done.',
      start: 'Tap a result to open it and read its INPUTS and RESULTS. Nothing here yet? Finish any workflow and tap SAVE RESULT on its report.',
    },
    seeing: [
      'SAVED RESULTS lists your completed workflow runs, each with its name and date, and its project if one was attached.',
      'Open one to see its report: PRIMARY RESULT, INPUTS, RESULTS, NOTES, WARNINGS and a Report ID.',
    ],
    control: [
      'Tap a result to open or close it (▸ / ▾).',
      'In an open result: SHARE AS TEXT, SHARE AS IMAGE (where it shows) and DELETE (it asks first).',
    ],
    changes: [
      'Nothing recalculates here. Every number is exactly what was saved when the run finished, so the record stays as it was on the day.',
    ],
    teaches: [
      'A saved report shows how a figure was reached, long after the job: anyone can check the inputs behind it.',
      'The date and project tie each number to one venue or rig; a figure worked out for another room may not apply to this one.',
    ],
    tryThis: [
      'Finish any workflow and tap SAVE RESULT on its report: it appears here.',
      'Open a result and read its INPUTS: each one says what was entered for that run.',
    ],
  },
};
