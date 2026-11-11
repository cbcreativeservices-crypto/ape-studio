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
  'Top right: the first ⓘ is the scope note (planning education, not legal or safety advice); the second opens this guide.';

// ─────────────────────────────────────────────────────────── a stage screen ──

/** WHAT YOU'RE SEEING on any stage: the header, the stage's own sections, the question dots. (The
 *  findings list's colours are said in WHAT YOU CONTROL, beside SEE THEM ↓ — the seeing step has no
 *  room left under the longest section lists.) */
export function stageSeeing(kicker: string, sections: string): string[] {
  return [
    `You’re in ${kicker}: the name, its % or BLOCKED, the intro and WHY THIS MATTERS.`,
    `Sections: ${sections}.`,
    'Dots: green done, amber flagged or optional left blank, red conflict, gray required and open, dark gray not applicable.',
  ];
}

/** WHAT YOU CONTROL on any stage screen (identical in both labs bar the packet's name). */
/** Post-Production's shared labels say PROJECT; Pre-Production's say PLAN
 *  (owner 2026-11-09). */
export type PlanWord = 'PLAN' | 'PROJECT';

export function stageControl(packetName: string, word: PlanWord = 'PLAN'): string[] {
  return [
    'Answer by typing, tapping chips (some take several) or filling a table: + ADD ROW, ✕ removes a row, UNDO restores it.',
    'Tap “Not applicable to this project”, type why, then SAVE. A skip with a reason counts as a decision; UNDO undoes it.',
    'Answers save as you go. If one fails, a red warning stays on top until a later one saves.',
    `SEE THEM ↓ opens WHAT THIS ${word} IS STILL MISSING (red edge: a blocker; amber: flagged). The bottom link opens WHAT’S LEFT IN THE WHOLE ${word} · ${packetName.toUpperCase()}.`,
    `‹ goes back to where you came from: the lab home, the ${packetName} or an exercise. ${CHIPS_LINE}`,
  ];
}

// ──────────────────────────────────────────────────────── an exercise screen ──

/** WHAT YOU'RE SEEING on any exercise screen. */
export function activitySeeing(stageNum: number, title: string, offeredOn: string): string[] {
  return [
    `This is STAGE ${stageNum} · EXERCISE: “${title}”, offered on ${offeredOn}.`,
    'Read the brief first: it describes a job that has already gone wrong. Under it is the project type this attempt uses.',
    'The checklist shows ✓ for each check you’ve passed and ○ for each one still open. It reads SOLVED once every check passes.',
  ];
}

/** WHAT YOU CONTROL on any exercise screen. */
export function activityControl(word: PlanWord): string[] {
  return [
  `Tap OPEN THE ${word} AND FIX IT to repair the broken version on the real stage screen. Once you’ve solved it, the button reads REVIEW YOUR WORK.`,
  'READ THE REASONING explains the exercise at any time, but it gives the answer away, so open it when you choose. After you solve it, it reads READ THE DEBRIEF.',
  'START AGAIN asks you to confirm, then puts the original broken version back.',
  `‹ returns to the lab home. ${CHIPS_LINE}`,
  ];
}
export const ACTIVITY_CONTROL: string[] = activityControl('PLAN');

/** WHAT CHANGES on any exercise screen: the loop, and why it is built that way. */
export const ACTIVITY_CHANGES: string[] = [
  'The broken version is a practice project, kept apart from your own. Nothing you do to it changes them or counts toward the lab.',
  'You fix it on the same stage screen you use for your own work, so every check and finding behaves exactly as it would there.',
  'Each time you come back here, the checklist is checked again: a ○ turns ✓ only when your fix passes that check. Leave midway and your work waits for you.',
];
