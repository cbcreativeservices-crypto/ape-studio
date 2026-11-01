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
      ? `WHAT ARE YOU CALCULATING? (below the inputs) picks one of its ${n} calculations, each with its own inputs and formula.`
      : 'WHAT ARE YOU CALCULATING? (below the inputs) shows its one calculation.';

  const tryThis: string[] = [];
  if (ex) {
    const stepsLine = 'Open ▸ WORKED STEPS under the answer: the example numbers go into the formula, one line at a time.';
    const unitLine = (shown: string, next: string) => `Tap ${shown} itself: it reads ${next} — the same quantity in another unit.`;
    tryThis.push(`Type the grey example value into each box (then CALCULATE, if it shows): ${ex.label} reads ${ex.at4}.`);
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
          ? `Tap SIG FIGS to 5: ${ex.label} now reads ${ex.at5} — the same answer, one more figure.`
          : `Tap SIG FIGS to 5: ${ex.label} now reads ${ex.at5} — the same answer to 5 figures; 4 figures round it to ${ex.at4}.`,
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
      tryThis.push(`Tap SEND → beside ${ex.label}, then pick another calculation under WHAT ARE YOU CALCULATING?: an input offers ⤵ USE ${ex.label}.`);
    } else if (!usedUnit && unitAfter && plainShown(unitAfter[1])) {
      tryThis.push(unitLine(unitAfter[0], unitAfter[1]));
    } else if (ex.steps && !usedSteps) {
      tryThis.push(stepsLine);
    }
    if (tryThis.length < 2) tryThis.push('Change one input and watch which results move — then open π KEY to see why the formula moves them.');
  } else {
    tryThis.push('Type the grey example value into each box (then CALCULATE, if it shows) and read each line of YOUR ANSWER.');
    tryThis.push('Change one input and watch which results move — then open π KEY to see why the formula moves them.');
  }

  const control = [
    fields.some((f) => f.quantity === 'list')
      ? `INPUTS: ${names}. A list box takes several numbers, separated by commas; grey text in an empty box is an example.`
      : `INPUTS: ${names}. Type a number in each; a grey number in an empty box is an example value.`,
    '⇄ switches a box’s unit; ⓘ says what an input means; a ⚠ under a box flags a value worth a second look.',
    picker,
    'In the answer: tap a number for another unit; SEND → (if an input takes it) passes it on; SHARE / COPY RESULT sends the report. SIG FIGS cycles 3, 4, 5.',
  ];
  if (capped) control.push('On this account, CALCULATE reveals each new answer and uses one of this week’s calculations; an error costs nothing.');

  // WHY the answer moves: the calculation's formula in words (its π KEY
  // text) — in WHAT CHANGES while that step still fits, else in WHAT THIS
  // TEACHES in place of the π KEY pointer, else the formula alone.
  const rest = [
    capped
      ? 'New inputs wait for CALCULATE (one more of this week’s calculations); ▸ WORKED STEPS shows your numbers in the formula.'
      : 'Change any input and every result re-solves at once; ▸ WORKED STEPS puts your numbers into the formula.',
    'Inputs with no answer (a zero, a reversed pair) get words saying what is wrong — never a made-up number.',
  ];
  const formulaLine = `The answer is computed exactly from the formula shown: ${fn.formula}`;
  const withWords = fn.plainFormula ? `${formulaLine} — ${fn.plainFormula}` : formulaLine;
  const wordsInChanges = !!fn.plainFormula && [withWords, ...rest].join(' ').length <= SCREEN_GUIDE_BUDGET.low;
  const changes = [wordsInChanges ? withWords : formulaLine, ...rest];
  const teachRest = [
    'WHY THIS MATTERS, PRACTICAL EXAMPLE and COMMON MISTAKES (scroll down) tie the result to real work.',
    'SEND → chains answers from one calculator into the next, the way a real system design flows.',
  ];
  const teachWords = `What “${fn.name}” works out, and how each input moves it: ${fn.plainFormula ?? ''}`;
  const teaches = [
    !wordsInChanges && fn.plainFormula && [teachWords, ...teachRest].join(' ').length <= SCREEN_GUIDE_BUDGET.low
      ? teachWords
      : `What “${fn.name}” works out, and how each input moves it. π KEY reads the formula in plain English.`,
    ...teachRest,
  ];

  return {
    seeing: [
      'YOUR ANSWER (top): pinned while you type below, it fills in once every input has a value.',
      `Under the glass: FUNCTION (“${fn.name}”), SIG FIGS (how many figures show) and FORMULA π KEY.`,
      'Below the inputs: WHAT ARE YOU CALCULATING?, the FORMULA line, WHY THIS MATTERS, PRACTICAL EXAMPLE, COMMON MISTAKES, IN THE GLOSSARY.',
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
    seeing: [
      'AUDIO CALCULATOR LABORATORY: every calculator in the app, sorted into ten category tiles, from WAVES & TIME to ELECTRONICS.',
      'Each tile shows how many CALCULATORS it holds.',
      '▸ CUSTOM CALCULATOR WORKFLOWS (top) and ▾ ABOUT THIS LAB. ⛓ CHAIN ACTIVE appears while a result you sent is waiting.',
      'π KEY (top right) opens the SYMBOL KEY; the ✓ opens VERIFIED CALCULATION — how each result is computed.',
    ],
    control: [
      'Tap a category tile: its calculators open in a popup, grouped by job. Tap one to open it; ✕ or a tap outside closes the popup.',
      '▸ CUSTOM CALCULATOR WORKFLOWS opens ＋ NEW WORKFLOW, MY WORKFLOWS & TEMPLATES ›, SAVED PROJECTS ›, SAVED RESULTS › and your recent workflow (RECENT · TAP TO RUN).',
      '⛓ CHAIN ACTIVE: ✕ CLEAR drops the result you sent.',
      'π KEY: the Greek letters and maths symbols the calculators use.',
    ],
    changes: [
      'Calculators that solve one job several ways share a page: WHAT ARE YOU CALCULATING? picks the one you need, and the inputs change to match.',
      'A result can be SENT into another calculator — sensitivity → voltage → gain → headroom — so one answer feeds the next.',
      'A workflow runs several calculators in order and carries the answers forward for you.',
    ],
    teaches: [
      'The maths behind everyday audio work — levels, distance, power, rooms, digital — with the reasoning shown, not just the result.',
      'Every calculator shows its FORMULA, WORKED STEPS, WHY THIS MATTERS, a PRACTICAL EXAMPLE and COMMON MISTAKES.',
      'It has its own card on Home (OPEN CALCULATORS): a reference for whenever a lab, a course or a job needs the numbers.',
    ],
    tryThis: [
      'Open WAVES & TIME › Sound & Wave and type 100 in FREQUENCY (then CALCULATE, if it shows): PERIOD reads 10 ms — one cycle of a 100 Hz tone.',
      'Open LEVELS & DECIBELS › Audio Level Converter and type 4 in LEVEL (dBu) (then CALCULATE, if it shows): VOLTAGE (RMS) reads 1.228 V.',
      'Tap π KEY and find λ (lambda): wavelength, the length of one cycle — λ = c / f.',
    ],
  },

  // ── CalcSymbolsKeyScreen ──────────────────────────────────────────────────
  symbols: {
    seeing: [
      'SYMBOL KEY: the Greek letters and maths symbols used in the calculators, in groups.',
      'GREEK LETTERS, OPERATORS & RELATIONS, CALCULUS & LOGARITHMS, POWERS, SUBSCRIPTS & PREFIXES, COMMON VARIABLES, VALUES THAT KEEP TURNING UP.',
      'Each row: the symbol, its name, what it means in audio maths, and often a formula where it appears.',
    ],
    control: [
      'Scroll to browse.',
      'A row marked ⓘ TAP FOR GLOSSARY DEFINITION opens that term right here; close it to come back.',
      '‹ returns to where you came from — the lab home, or the calculator whose FORMULA KEY you opened it from (π OPEN THE FULL SYMBOL KEY ›).',
    ],
    changes: [
      'Nothing here calculates: it is the dictionary for the formulas.',
      'Letters keep a formula short: λ = c / f reads “wavelength equals the speed of sound divided by the frequency”.',
      'Where one glyph has two jobs, its row names both — ρ is resistivity for cable, or the density of air.',
      'A calculator’s own π KEY lists only the symbols in its formula; this screen holds them all.',
    ],
    teaches: [
      'How to read the formulas: what each letter stands for, and the prefixes (µ, m, k…) that scale a unit.',
      'The few that come up everywhere: π, Δ (a change), λ (wavelength), Ω (ohms).',
    ],
    tryThis: [
      'Find λ under GREEK LETTERS and tap it: the glossary entry for Wavelength opens right here.',
      'Find Δ — a change, or the difference between two values — then spot TIME OFFSET Δt in Phase & Time Offset.',
      'Find µ: as a prefix it means one-millionth, so 10 µF is 0.00001 F.',
    ],
  },

  // ── CalcWorkflowsScreen ───────────────────────────────────────────────────
  workflows: {
    seeing: [
      'CALCULATOR WORKFLOWS: guided sequences that run several calculators in order.',
      'MY WORKFLOWS: the ones you saved, each card listing its numbered steps.',
      'WORKFLOW TEMPLATES: built-in sequences, such as Delay Speaker Setup and Room Acoustics Survey. A gold ★ marks a favorite.',
    ],
    control: [
      '▶ RUN starts a workflow, one calculator per step.',
      'On a template: DUPLICATE & CUSTOMIZE makes your own copy and opens it in the builder.',
      'On your own: EDIT, DUPLICATE, DELETE (it asks first; saved results are kept), and ▲ ▼ to reorder the list.',
      '＋ NEW (top right) opens an empty builder. ★ adds or removes a favorite.',
    ],
    changes: [
      'Each step is one of the lab’s own calculators — the same formula as on its own page, never a copy.',
      'While running, an answer is offered to a later step only where it means the same thing: an RT60 fills an RT60, but a voltage drop never fills a supply voltage.',
      'Templates are read-only, so changes always happen on your own copy.',
    ],
    teaches: [
      'How real design jobs chain calculations: RT60, then critical distance and the direct-to-reverberant ratio (Room Acoustics Survey) is one job, not three.',
      'A template’s steps show one sensible order to work in.',
    ],
    tryThis: [
      'Tap ▶ RUN on Room Acoustics Survey: once step 1 has its numbers, step 2 offers ⤵ USE RT60 (STEP 1).',
      'Tap DUPLICATE & CUSTOMIZE on a template: your copy opens in the builder with “copy” added to its name.',
    ],
  },

  // ── CalcWorkflowEditScreen ────────────────────────────────────────────────
  workflowEdit: {
    seeing: [
      'NEW WORKFLOW (or EDIT WORKFLOW): the builder for a guided calculator sequence.',
      'WORKFLOW NAME and DESCRIPTION (OPTIONAL) at the top.',
      'STEPS: the calculators in run order — each with its number, its calculation and its calculator’s name, plus a box for a short instruction shown while it runs.',
    ],
    control: [
      '＋ ADD CALCULATOR lists every calculation; type in Search calculators to narrow it, then tap one to add it as the last step.',
      '▲ ▼ move a step up or down; ✕ removes it.',
      'SAVE (top right) stores the workflow. Leaving with unsaved changes asks “Discard changes?” first.',
    ],
    changes: [
      'Step order is run order: a step can use the answers of the steps before it, so put the step that produces a value before the one that needs it.',
      'A step offers only answers that mean the same thing as its input — a power fills a power, but an RT60 never fills a target RT60 — so some inputs offer nothing and you type them.',
    ],
    teaches: [
      'How to break a job into a sequence of calculations, each feeding the next.',
      'A saved workflow runs again with new numbers any time; the formulas stay the calculators’ own.',
    ],
    tryThis: [
      'Name it, add Power from voltage & impedance, then Current from power & voltage, and SAVE: run it, fill in step 1, and step 2 offers ⤵ USE POWER (STEP 1).',
      'Tap ▲ on the last step: it moves up, and the step numbers follow the new order.',
    ],
  },

  // ── CalcWorkflowRunScreen — a step ────────────────────────────────────────
  workflowRun: {
    seeing: [
      'The workflow’s name, with the current step’s calculation under it.',
      'The step buttons, from Step 1 to RESULTS: the current one is lit; finished steps are marked done.',
      'The step’s inputs (any instruction above them), then YOUR ANSWER and the FORMULA it uses.',
    ],
    control: [
      'Type values as in any calculator: ⇄ switches a unit, ⓘ explains an input, a tap on an answer number changes its unit.',
      '⤵ USE … (STEP n) fills an input with an earlier step’s answer that means the same thing. Typing over it marks it Manually overridden; ⟲ RESTORE IMPORT brings it back. A saved import that no longer fits says so: type a value.',
      '⛭ USE A SAVED PROJECT (when you have one) attaches a project, so its values offer ⤵ USE … (PROJECT) on inputs of the same kind.',
      '‹ PREVIOUS and CONTINUE › move between steps (FINISH ✓ on the last); tap a step button to jump. SAVE, where shown, keeps your progress.',
    ],
    changes: [
      'Each step computes exactly as its calculator does on its own page.',
      'Change a value a later step used, and that later result recalculates; a ↻ note says how many changed.',
      'An answer is offered only where it means the same thing: a distance never fills a time, and a voltage drop never fills a supply voltage. Where nothing earlier fits, type the value.',
    ],
    teaches: [
      'How one answer becomes the next calculation’s input — the way a real system is designed, step by step.',
      'Where every number came from: an imported input shows its source, such as “From … (step 1)”.',
    ],
    tryThis: [
      'In the Ohm’s Law template, type 40 and 8 on step 1: POWER reads 200 W and CURRENT reads 5 A.',
      'Then CONTINUE ›: on step 2, tap ⤵ USE POWER (STEP 1) and type 40 in VOLTAGE (RMS) — CURRENT reads 5 A, the same current worked out from the power.',
    ],
  },

  // ── CalcWorkflowRunScreen — the finished report ───────────────────────────
  workflowResults: {
    seeing: [
      'The finished report: PRIMARY RESULT, INPUTS, RESULTS, then any NOTES and WARNINGS, ending with its Report ID.',
      'YOUR NOTES: a box for your own notes, added to the saved and shared report.',
    ],
    control: [
      'SAVE RESULT stores the report in SAVED RESULTS; it reads SAVED ✓ once stored.',
      'SHARE AS TEXT sends it as plain text; SHARE AS IMAGE, where it shows, sends a picture of the report.',
      'START AGAIN clears the inputs for a fresh run of the same workflow. Tap a step button above to go back to a step.',
    ],
    changes: [
      'The report is built from each step’s answer as it stood when you tapped FINISH ✓.',
      'Typing in YOUR NOTES re-arms SAVE RESULT, so SAVED ✓ never covers words that were not stored.',
    ],
    teaches: [
      'How a calculation is documented on the job: what went in, where it came from, what came out, and the warnings that apply.',
    ],
    tryThis: [
      'Type a line in YOUR NOTES: SAVED ✓ turns back into SAVE RESULT until you save again.',
      'Tap SHARE AS TEXT: the whole report goes out as text, ready for an email or a message.',
    ],
  },

  // ── CalcProjectsScreen — the list ─────────────────────────────────────────
  projects: {
    seeing: [
      'SAVED PROJECTS: reusable values for one venue or rig — room dimensions, temperature, listener distance, impedance, target SPL.',
      'Each card: the project’s name, its notes, and the labels of the values it holds.',
    ],
    control: [
      '＋ NEW (top right) starts a project; EDIT opens one; DELETE removes it (it asks first).',
      'While running a workflow, ⛭ USE A SAVED PROJECT attaches one.',
    ],
    changes: [
      'A project changes only when you edit it here: running a workflow never writes back into it.',
      'A project value is offered only to an input of the same kind — a power never fills a voltage. Check it is the same thing before you tap ⤵ USE.',
    ],
    teaches: [
      'That a venue’s fixed numbers — room size, temperature, distances — can be stored once with their units and reused for every plan in that room or rig.',
    ],
    tryThis: [
      'Tap ＋ NEW, name it, add a value labelled Listener distance as Length / distance, type 12, and SAVE.',
      'Run a workflow, attach the project, and look for ⤵ USE … (PROJECT) under a distance input.',
    ],
  },

  // ── CalcProjectsScreen — the editor ───────────────────────────────────────
  projectEdit: {
    seeing: [
      'NEW PROJECT (or EDIT PROJECT): PROJECT NAME, NOTES (OPTIONAL) and VALUES.',
      'Each value: a label, its type (such as Length / distance), a number and a unit.',
    ],
    control: [
      'Type a label; tap the type button (marked ⇄) to step through Length / distance, Temperature, SPL, Power, Impedance and the rest; tap the unit button to switch units.',
      '＋ ADD VALUE adds a row; ✕ removes one.',
      'SAVE (top right) stores the project; ‹ with unsaved changes asks “Discard changes?” first.',
    ],
    changes: [
      'Changing a value’s type clears its number: a number only means something with its kind and unit.',
      'Rows without a label or a valid number are skipped on save.',
      'Each value is stored once, so a workflow can show it in whatever unit its input uses.',
    ],
    teaches: [
      'Every number in audio needs its kind and its unit: 10 alone means nothing — 10 m and 10 Ω are different things.',
    ],
    tryThis: [
      'Add a value, type 20, then tap its type button: the type moves on and the number clears.',
      'Give a Length / distance value 20, then tap its unit button: m becomes ft and the number stays, so 20 m is now 20 ft — a different length. Pick the unit your number is in.',
    ],
  },

  // ── CalcResultsScreen ─────────────────────────────────────────────────────
  results: {
    seeing: [
      'SAVED RESULTS: your completed workflow runs, each with its name and date (and its project, if one was attached).',
      'An open result shows its report: PRIMARY RESULT, INPUTS, RESULTS, NOTES, WARNINGS and a Report ID.',
    ],
    control: [
      'Tap a result to open or close it (▸ / ▾).',
      'Open: SHARE AS TEXT, SHARE AS IMAGE where it shows, and DELETE (it asks first).',
    ],
    changes: [
      'Nothing recalculates here: every number is exactly what was saved when the run finished.',
    ],
    teaches: [
      'Keeping a record: a saved report shows how a figure was reached, long after the job.',
    ],
    tryThis: [
      'Finish any workflow and tap SAVE RESULT on its report — it appears here.',
      'Open a result and read its INPUTS: each one says what was entered for that run.',
    ],
  },
};
