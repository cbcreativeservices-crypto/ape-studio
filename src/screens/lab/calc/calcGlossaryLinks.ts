/**
 * calcGlossaryLinks — the bridge between glossary terms and the Audio Calculator
 * Laboratory (owner 2026-08-07). A glossary term is treated as a "calculator
 * equation" only when an actual calculator workspace covers it — that is the set
 * that earns the equation-purple styling AND can deep-link into the calculator.
 *
 * The set is derived at module load from the LIVE `WORKSPACES` registry (each
 * workspace's hand-authored `glossary: string[]`), so it can never drift from the
 * calculator itself. Match key is the term display name, NORMALIZED
 * (case/whitespace-insensitive) because those arrays are authored with
 * inconsistent casing ('Sound pressure level' vs 'Sound Pressure Level') and the
 * glossary rows have no slug to join on.
 *
 * NOTE: coverage here means "a workspace lists this term". Callers that want only
 * genuine EQUATIONS (e.g. the purple title) additionally require the glossary row
 * to carry a `formula_symbolic` — a listed variable like "Voltage" is calculator-
 * backed but is not itself an equation.
 */
import { WORKSPACES } from './registry';

export type CalcLink = { workspaceId: string; workspaceName: string };

function norm(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// normalizedTermName -> the workspace(s) that reference it (first-listed wins as
// the primary link target; the rest are alternates for a future picker).
const BY_TERM: Map<string, CalcLink[]> = (() => {
  const m = new Map<string, CalcLink[]>();
  for (const ws of WORKSPACES) {
    for (const term of ws.glossary ?? []) {
      const key = norm(term);
      if (!key) continue;
      const list = m.get(key) ?? [];
      if (!list.some((l) => l.workspaceId === ws.id)) {
        list.push({ workspaceId: ws.id, workspaceName: ws.name });
      }
      m.set(key, list);
    }
  }
  return m;
})();

/** True if any calculator workspace covers this term name. */
export function isCalcBackedTerm(termName: string): boolean {
  return BY_TERM.has(norm(termName));
}

/** The primary calculator workspace a term links to, or null if uncovered. */
export function calcLinkForTerm(termName: string): CalcLink | null {
  const hits = BY_TERM.get(norm(termName));
  return hits && hits.length ? hits[0] : null;
}

/** Every calculator workspace that references a term (for a future picker). */
export function calcLinksForTerm(termName: string): CalcLink[] {
  return BY_TERM.get(norm(termName)) ?? [];
}
