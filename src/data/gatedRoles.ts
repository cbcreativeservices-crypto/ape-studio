/**
 * gatedRoles — which role names the app itself says need education beyond a
 * Pro Audio Training Academy credential, and how to spot one in prose.
 *
 * ── WHY THIS MODULE EXISTS ───────────────────────────────────────────────────
 *
 * HARD RULE (owner, 2026-09-15): "we must be clear when other education —
 * degrees, certifications, etc. — is required for careers. always. every time."
 *
 * Everywhere that renders a `Career[]` honours that by labelling each gated role
 * individually. But `subjectMeta.ts` stores its career applications as a single
 * PROSE STRING — "Stagehand, rigger, production manager, venue crew." — with no
 * structure to attach a label to, and the Explore → SUBJECTS screen prints it
 * verbatim. A pass-5 check found six of those fifty strings naming roles this
 * app classifies as gated, including a fourth "rigger" after three had already
 * been corrected in the structured files.
 *
 * ── AND WHY IT IS DERIVED ────────────────────────────────────────────────────
 *
 * My first attempt matched the prose against the CAREER INDEX's regulated
 * titles, and it was inert: the index names roles canonically ("Entertainment
 * Rigger", "Clinical Audiologist") and the prose uses the short form ("rigger"),
 * so not one of the ninety-four matched and the disclosure rendered nowhere. It
 * was the same shape as the inert route predicate found two passes earlier — a
 * check that reads a different source from the one holding the fact.
 *
 * So the list is derived from the `requires` codes THEMSELVES, in the same files
 * that carry them. It cannot fall behind the classification, because it is the
 * classification.
 */
import { CREDENTIAL_COPY_BY_SLUG } from './credentialCopy';
import { TOPIC_COPY_BY_GS } from './topicCopy';

/** Every role name anywhere in the copy that carries a `requires` code. */
export const GATED_ROLE_NAMES: readonly string[] = (() => {
  const out = new Set<string>();
  for (const c of Object.values(CREDENTIAL_COPY_BY_SLUG)) {
    for (const r of c.careers) if (r.requires) out.add(r.name);
  }
  for (const t of Object.values(TOPIC_COPY_BY_GS)) {
    for (const r of t.roles) if (r.requires) out.add(r.name);
  }
  return [...out];
})();

/**
 * Does this free-text list of job titles name one of them?
 *
 * Whole-word matching only, so "sonar systems technician" does not trip on
 * "technician", and names shorter than five characters are ignored because at
 * that length a substring match is more likely to be a coincidence than a role.
 *
 * Turning `subjectMeta` into structured careers is the better answer and would
 * let each role carry its own label. Until then this lets the screen state the
 * disclosure once for the whole list — which is what the rule requires and what
 * the format allows.
 */
export function namesGatedRole(prose: string): boolean {
  const text = prose.toLowerCase();
  return GATED_ROLE_NAMES.some((raw) => {
    const t = raw.toLowerCase();
    if (t.length < 5) return false;
    const i = text.indexOf(t);
    if (i < 0) return false;
    const before = i === 0 ? ' ' : text[i - 1];
    const after = text[i + t.length] ?? ' ';
    return !/[a-z]/.test(before) && !/[a-z]/.test(after);
  });
}
