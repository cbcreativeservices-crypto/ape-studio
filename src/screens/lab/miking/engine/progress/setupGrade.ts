/**
 * The final task's grading (lesson L89; review C1), pure and tested. A brief
 * accepts SEVERAL setups; what is checked is the reasoning: the chosen setup
 * must be one the brief allows, every required reason must be ticked, and no
 * wrong reason (a brand, bass emphasis) may be. It never compares the answer
 * with one fixed position.
 */
import type { SetupTask } from '../model/types.ts';

export type SetupGrade = { pass: boolean; lines: { ok: boolean; text: string }[] };

export function gradeSetup(t: SetupTask, setupId: string | null, reasons: ReadonlySet<string>): SetupGrade {
  const setup = t.setups.find((s) => s.id === setupId);
  if (!setup) return { pass: false, lines: [{ ok: false, text: 'Choose a setup first.' }] };
  const lines: { ok: boolean; text: string }[] = [{ ok: setup.ok, text: setup.feedback }];
  for (const r of t.reasons) {
    const on = reasons.has(r.id);
    if (r.role === 'required' && !on) lines.push({ ok: false, text: r.feedback });
    if (r.role === 'wrong' && on) lines.push({ ok: false, text: r.feedback });
  }
  return { pass: lines.every((l) => l.ok), lines };
}
