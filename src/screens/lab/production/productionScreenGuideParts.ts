/**
 * Production labs — the shared pieces of the "explain this screen" guides
 * (owner 2026-10-31, Screen Guide rollout). Audio Pre-Production and Audio
 * Post-Production are ONE engine and two content sets: the same four screens
 * (ProductionLabScreen, ProductionStageScreen, ProductionActivityScreen,
 * ProductionPacketScreen) draw both labs from `features/production/labs.ts`.
 * So the parts of a guide that describe the SCREEN (its controls, its badge,
 * its checklist) are written once here, and each lab's file
 * (preprodScreenGuides.ts / postprodScreenGuides.ts) adds what its own stages
 * and exercises are about.
 *
 * Every name quoted is the on-screen name, read from those four screens and
 * from ReadinessMeter.tsx / FieldRow.tsx / AcceptConditionSheet.tsx. Every
 * finding title, field label and option quoted in a TRY THIS is read from the
 * lab's stage data, and what it says happens is what `readStage` /
 * `checkActivity` produce for that answer — test/screenGuide_preprod_20261031
 * and test/screenGuide_postprod_20261031 replay each one.
 *
 * STEPPED: each section is one step and must fit a 375×812 phone with no
 * scrolling — SCREEN_GUIDE_BUDGET (types.ts) holds every section. None of
 * these screens has a Rack Unit, so every step sits low (regions off).
 *
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never
 * skills; no "N of total"; "suggest" never "recommend"; no gear makers; no
 * build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** The two header chips, said once in every guide's controls. */
export const CHIPS_LINE =
  'Top right: the first ⓘ is the lab’s scope note (planning education, not legal or safety advice); the second opens this guide.';

// ─────────────────────────────────────────────────────────── a stage screen ──

/** WHAT YOU'RE SEEING on any stage: the header, the stage's own sections, the question dots. (The
 *  findings list's colours are said in WHAT YOU CONTROL, beside SEE THEM ↓ — the seeing step has no
 *  room left under the longest section lists.) */
export function stageSeeing(kicker: string, sections: string): string[] {
  return [
    `${kicker}: the stage name, its % or BLOCKED, the intro and WHY THIS MATTERS.`,
    `Sections: ${sections}.`,
    'Dots: green done, amber flagged or optional and blank, red conflict, grey required and open, dark grey not applicable.',
  ];
}

/** WHAT YOU CONTROL on any stage screen (identical in both labs bar the packet's name). */
export function stageControl(packetName: string): string[] {
  return [
    'Answer by typing, tapping chips (some take several) or filling a table: + ADD ROW, ✕ removes a row, UNDO restores it.',
    '“Not applicable to this project”: type why, then SAVE; a justified skip counts as a decision, and UNDO brings it back.',
    'Answers save as you go; if one fails, a red warning stays at the top until a later one saves.',
    `SEE THEM ↓ jumps to WHAT THIS PLAN IS STILL MISSING (red edge: a blocker; amber: flagged). The last button opens WHAT’S LEFT IN THE WHOLE PLAN · ${packetName.toUpperCase()}.`,
    `‹ goes back to what opened this stage: the lab home, the packet or an exercise. ${CHIPS_LINE}`,
  ];
}

// ──────────────────────────────────────────────────────── an exercise screen ──

/** WHAT YOU'RE SEEING on any exercise screen. */
export function activitySeeing(stageNum: number, title: string, offeredOn: string): string[] {
  return [
    `Header: STAGE ${stageNum} · EXERCISE and its name, “${title}”. Offered on ${offeredOn}.`,
    'The brief: a plan that has already gone wrong. Under it, the project type this attempt uses.',
    'The checklist: ✓ for each check passed, ○ for each still open. SOLVED once every check passes.',
  ];
}

/** WHAT YOU CONTROL on any exercise screen. */
export const ACTIVITY_CONTROL: string[] = [
  'OPEN THE PLAN AND FIX IT opens the real stage screen with the broken plan loaded. It reads REVIEW YOUR WORK once solved.',
  'READ THE REASONING shows the exercise’s explanation at any time — it gives the answer away, so read it when you choose. Once solved it reads READ THE DEBRIEF.',
  'START AGAIN asks first, then puts the original broken plan back.',
  `‹ returns to the lab home. ${CHIPS_LINE}`,
];

/** WHAT CHANGES on any exercise screen: the loop, and why it is built that way. */
export const ACTIVITY_CHANGES: string[] = [
  'The broken plan is a real practice project, kept apart from your own projects. It never counts toward the lab.',
  'You repair it on the ordinary stage screen, so every check and finding works there exactly as on your own plan.',
  'Each return here re-checks the plan: a ○ turns ✓ only when that repair really landed. Leave mid-way and it waits for you.',
];
