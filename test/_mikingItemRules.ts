/**
 * Miking Labs — shared checks for a lesson's words (not a test file itself):
 *   • RESEARCH_NAMES: makers, models and people met in the research, never in
 *     learner text (the brand list in mikingLearnerText.test.ts covers the
 *     common brands; this adds the speaker / hand-drum research names);
 *   • itemRules: the item-writing rules of LESSON_JOURNEY §5 — the correct
 *     option is never conspicuously longer (≤ 1.6 × the others' mean, and the
 *     longest in at most a quarter of the items), no absolute words in the
 *     distractors, ≥ 3 options, and every distractor has its own "why".
 */
import assert from 'node:assert/strict';

export const RESEARCH_NAMES = /\b(Hammond|Celestion|Marshall|Ampeg|Fender|Shure|Audix|122H|122A|147A|V30|Vintage 30|SM57|SM58|SM81|KSM\d*|PGA27|Beta ?5\d|Mills|Byrne|Michaels|Mishur|Zito|Gilbert|Heritage|Metropolitan|Met|Duvel|Brush|Patranabis|Raman)\b/;

const INTERNAL = new Set(['src', 'quote', 'prov', 'bandProv', 'strikeSrc', 'unknowns', 'examples', 'kind']);
export function learnerStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => learnerStrings(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!INTERNAL.has(k)) learnerStrings(x, out);
  return out;
}

type Item = { id: string; options: readonly string[]; correct: string; why: Readonly<Record<string, string>> };
export function itemRules(lesson: { scenarios: readonly Item[]; symptoms: readonly Item[]; diagnostic: readonly Item[] }) {
  const items = [...lesson.scenarios, ...lesson.symptoms, ...lesson.diagnostic];
  for (const s of items) {
    const others = s.options.filter((o) => o !== s.correct);
    const mean = others.reduce((a, o) => a + o.length, 0) / others.length;
    assert.ok(s.correct.length <= 1.6 * mean, `${s.id}: correct ${s.correct.length} vs mean ${mean.toFixed(1)}`);
    assert.ok(s.options.length >= 3, s.id);
    for (const o of others) {
      assert.doesNotMatch(o, /\b(always|any|never|every)\b/i, `${s.id}: "${o}"`);
      assert.ok(s.why[o] && s.why[o].length > 20, `${s.id}: no why for "${o}"`);
    }
  }
  const longest = items.filter((s) => s.options.every((o) => o === s.correct || o.length < s.correct.length)).length;
  assert.ok(longest <= items.length / 4, `correct is the longest in ${longest} of ${items.length}`);
}
