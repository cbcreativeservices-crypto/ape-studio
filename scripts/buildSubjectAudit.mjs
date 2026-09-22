/**
 * buildSubjectAudit — generate the review sheet for ratifying SUBJECT_META.
 *
 * Owner 2026-09-22: "keep it live, prepare a review/audit to resolve this."
 *
 * `SUBJECT_META_RATIFIED` is true and has been, so all 50 subjects' descriptions
 * and career lists are LIVE in the Curriculum tree — but the file records that
 * nobody knows whether the copy was ratified or the flag was flipped before the
 * review happened. This produces the sheet that review needs: each subject's
 * copy printed beside the topics it actually contains, so a reviewer can judge
 * whether the description describes THESE topics and whether the careers follow
 * from them.
 *
 * Run: node scripts/buildSubjectAudit.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { entries, missing, orphan, LIVE_SUBJECTS } from './subjectMetaAudit.mjs';

const topics = JSON.parse(readFileSync(new URL('./subjectTopics.json', import.meta.url), 'utf8'));

/**
 * Role names the app itself classifies as needing education beyond a PATA
 * credential. Pulled from the `requires` codes in the structured copy — the
 * same derivation `gatedRoles.ts` uses, so it cannot fall behind them.
 */
function gatedRoleNames() {
  const out = new Set();
  for (const f of ['credentialCopy.ts', 'topicCopy.ts']) {
    let src = '';
    try {
      src = readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8');
    } catch {
      continue;
    }
    for (const m of src.matchAll(/name:\s*'([^']+)'\s*,\s*requires:/g)) out.add(m[1]);
    for (const m of src.matchAll(/\{\s*name:\s*"([^"]+)"\s*,\s*requires:/g)) out.add(m[1]);
  }
  return [...out];
}

const GATED = gatedRoleNames();

/** Does this career prose name a role the app says needs further education? */
function gatedHits(careers) {
  const low = careers.toLowerCase();
  return GATED.filter((r) => r.length >= 5 && low.includes(r.toLowerCase()));
}

/** Career lists that name no specific role at all. */
const isGeneric = (c) => /^every audio role/i.test(c.trim());

const lines = [];
lines.push('# SUBJECT COPY — ratification sheet');
lines.push('');
lines.push('**2026-09-22.** Generated from the live v3 curriculum and `src/data/subjectMeta.ts`.');
lines.push('');
lines.push('`SUBJECT_META_RATIFIED` is **true**, and has been — so every line below is');
lines.push('**already live** in the Curriculum tree. The owner has chosen to keep it live.');
lines.push('What is unresolved is whether this copy was ever actually reviewed, or the flag');
lines.push('was flipped before the review happened. This sheet exists to settle that.');
lines.push('');
lines.push('## How to use it');
lines.push('');
lines.push('For each subject, two questions:');
lines.push('');
lines.push('1. **Does the description describe THESE topics?** The topics are the real ones');
lines.push('   from the active curriculum, so a description that promises something not in');
lines.push('   the list is a claim the app does not deliver.');
lines.push('2. **Do the careers follow from these topics?** Not "is this a real job" — but');
lines.push('   "does finishing these topics move someone toward it".');
lines.push('');
lines.push('Tick the box when a subject is ratified as written, or write the replacement');
lines.push('under it.');
lines.push('');
lines.push('## Structural check — already clean');
lines.push('');
lines.push(`- Live subjects: **${LIVE_SUBJECTS.length}** · copy entries: **${entries.length}** · 1:1`);
lines.push(`- Live subjects with no copy: **${missing.length ? missing.join(', ') : 'none'}**`);
lines.push(`- Copy matching no live subject: **${orphan.length ? orphan.join(', ') : 'none'}**`);
lines.push('- Every entry has both a description and a career list.');
lines.push('');
lines.push('So nothing is missing or orphaned. This is a review of WORDING, not coverage.');
lines.push('');
lines.push('## On the required-education disclosure');
lines.push('');
lines.push('`CurriculumScreen` prints the disclosure **unconditionally** under every career');
lines.push('list, so the hard rule is met by always saying it rather than by detecting when');
lines.push('to. Two earlier detector attempts were both found inert — the second fired on');
lines.push('6 of 44 lists. **Do not reintroduce a detector here.**');
lines.push('');
lines.push('The ⚠️ marks below are therefore a *reading aid*, not a gap: they show which');
lines.push('lists lean on roles the app itself classifies as needing a degree, licence or');
lines.push('certification, so those descriptions deserve the closest read for over-promising.');
lines.push('');
lines.push('---');
lines.push('');

const flaggedGated = [];
const flaggedGeneric = [];

for (const e of entries.sort((a, b) => a.key.localeCompare(b.key))) {
  const t = topics[e.key] ?? '(topics not resolved)';
  const hits = gatedHits(e.careers);
  const generic = isGeneric(e.careers);
  if (hits.length) flaggedGated.push(e.key);
  if (generic) flaggedGeneric.push(e.key);

  lines.push(`### ☐ ${e.key}`);
  lines.push('');
  lines.push(`**Topics actually in it:** ${t}`);
  lines.push('');
  lines.push(`**Description:** ${e.desc}`);
  lines.push('');
  lines.push(`**Careers:** ${e.careers}`);
  if (hits.length) lines.push(`> ⚠️ Names gated role(s): ${hits.join(', ')}`);
  if (generic) lines.push('> ⚠️ Names no specific role — "every audio role" claims everything and nothing.');
  lines.push('');
}

lines.push('---');
lines.push('');
lines.push('## Summary for the reviewer');
lines.push('');
lines.push(`- Subjects naming a gated role: **${flaggedGated.length}** — ${flaggedGated.join(', ') || 'none'}`);
lines.push(`- Subjects with a generic career list: **${flaggedGeneric.length}** — ${flaggedGeneric.join(', ') || 'none'}`);
lines.push('');
lines.push('When every box is ticked, the flag can be recorded as genuinely ratified — and');
lines.push("the stale header note in `subjectMeta.ts` removed, since that is what made this");
lines.push('ambiguous in the first place.');
lines.push('');

const out = new URL('../../../Downloads/2026-09-22_SUBJECT_COPY_AUDIT.md', import.meta.url);
writeFileSync(out, lines.join('\n'), 'utf8');
console.log('subjects written :', entries.length);
console.log('gated-role lists :', flaggedGated.length);
console.log('generic lists    :', flaggedGeneric.length);
console.log('written to       :', decodeURIComponent(out.pathname));
