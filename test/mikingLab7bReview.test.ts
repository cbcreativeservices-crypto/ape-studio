/**
 * Miking Lab 7 part 2 (B09–B17) — the 2026-10-08 two-expert review
 * (docs/labs/miking/REVIEW_LAB7B_2026_10_08.md). Pins what that review fixed:
 *
 *   B16   the hydrophone item asks about two quoted dB figures (the dB
 *         references differ) — not about "recorded level", which the
 *         references do not explain
 *   B15–  the practice gain key is the loudest SAFE peak near −12 dBFS (in a
 *   B17   quiet practice, the strongest gentle clap) — the same words as
 *         B13 and the headroom chain, where a GENTLE clap at −12 is the trap
 *   B12   the high-pass item has no negative stem and real distractors
 *   B09   a partner turning toward you: the voice's directivity explained
 *   B09–  a person is never "it": the START intro and the generated MEET IT
 *   B11   goal say "they / their voice" (noun.person)
 *   all   the practice's mixed-cards intro names the cards it mixes
 *   all   technique is said as practice, not as "must"
 *   all   the sibling-distractor giveaways the review rewrote stay gone
 *   B17   the M/S width words do not claim the rear lobe appears only when wide
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { journeyIntro } from '../src/screens/lab/miking/engine/journey.ts';
import { pageOf } from '../src/screens/lab/miking/engine/restructure.ts';
import type { DiagnosticItem, Lesson, MikingScenario, Symptom } from '../src/screens/lab/miking/engine/model/types.ts';
import { learnerStrings } from './_mikingItemRules.ts';

const IDS = ['B09', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17'];
const lesson = (id: string) => lessonById(id) as Lesson;
type Item = MikingScenario | Symptom | DiagnosticItem;
const items = (L: Lesson): Item[] => [...L.scenarios, ...L.symptoms, ...L.diagnostic];
const item = (id: string, itemId: string) => {
  const q = items(lesson(id)).find((s) => s.id === itemId);
  assert.ok(q, `${id} ${itemId}`);
  return q;
};
const src = (rel: string) => readFileSync(new URL(`../src/screens/lab/miking/${rel}`, import.meta.url), 'utf8');

describe('Lab 7b review (2026-10-08)', () => {
  it('B16: the hydrophone item is about quoted dB figures, keyed on the different references', () => {
    const q = item('B16', 'mo.mic.3');
    assert.match(q.prompt, /under water.*in air|in air.*under water/);
    assert.match(q.correct, /different dB references/);
    assert.doesNotMatch(q.prompt, /recorded level/);
    for (const o of q.options) assert.ok(q.correct === o || q.why[o], o);
  });

  it('B15–B17: the practice gain key is the loudest safe peak, never the gentle clap itself', () => {
    for (const [id, qid] of [['B15', 'tg.prac.gain'], ['B16', 'mo.prac.gain'], ['B17', 'cc.prac.gain']] as const) {
      const q = item(id, qid);
      assert.match(q.correct, /^The loudest safe peak near −12 dBFS$/, id);
      assert.match(q.explain, /loudest safe peak is (your|the) strongest repeatable gentle clap/, id);
      assert.doesNotMatch(JSON.stringify(q.why), /Set on a (gentle|quiet) clap/, id);
    }
    // B13 still teaches the same rule from the other side.
    assert.ok(item('B13', 'fd.ctx.2').options.includes('At −12 dBFS for the gentlest test clap'));
  });

  it('B12: the high-pass item has no negative stem', () => {
    const q = item('B12', 'pb.ctx.3');
    assert.doesNotMatch(q.prompt, /\bNOT\b/);
    assert.match(q.correct, /Nothing for the clip/);
  });

  it('B09: a partner turning toward you — the voice is louder in front of the mouth', () => {
    const q = item('B09', 'b9.rec.3');
    assert.match(q.explain, /in front of the mouth/);
    assert.match(q.correct, /faces your mic/);
  });

  it('B09–B11: a person is never "it" in the START intro or the MEET IT goal', () => {
    for (const id of ['B09', 'B10', 'B11']) {
      const L = lesson(id);
      assert.equal(L.noun.person, true, id);
      const intro = journeyIntro(L.noun, L.noun.subject);
      assert.doesNotMatch(intro, /\b(itself|its|it)\b/, `${id}: ${intro}`);
      assert.match(intro, /their voice/);
      const goal = pageOf(L, 'meet').goal;
      assert.doesNotMatch(goal, /\b(what it is|its sound|hear it)\b/, `${id}: ${goal}`);
    }
    // An instrument keeps the old words.
    assert.match(journeyIntro({ one: 'kick', many: 'kicks' }), /the kick itself and where its sound leaves/);
    const kit = src('engine/journeyKit.tsx');
    assert.doesNotMatch(kit, /the instrument and where its sound leaves/);
  });

  it('every practice mixes the cards its intro names', () => {
    const want: Record<string, RegExp> = {
      B10: /a shotgun from the stands, the radio frequencies, and polarity versus delay/,
      B11: /the stop conditions, the radio frequencies, and polarity versus delay/,
      B14: /the floor, two mics in time, and the glass/,
      B15: /surfaces, two mics in time, and the music feed/,
      B17: /the mono sum, two mics in time, and a failed side of the pair/,
    };
    for (const [id, re] of Object.entries(want)) assert.match(String(lesson(id).copy?.practice?.mixedIntro), re, id);
  });

  it('technique is said as practice, not as "must"', () => {
    const text = IDS.flatMap((id) => learnerStrings(lesson(id))).join('\n');
    assert.doesNotMatch(text, /headset must allow it|a boom must clear|handheld must (follow|reach)|What must you check\?|Distance is never the fix|What must the gain|What else must (change|you change)/);
    assert.doesNotMatch(src('lessons/shared/broadcast/sportMics.ts'), /so it must be close/);
  });

  it('the rewritten distractors stay gone (two siblings against an odd-one-out key)', () => {
    const GONE = /^(To the program, a little quieter than usual|Straight behind it, facing the crowd|Only in the headset, since it is nearer the ear|Fit one, if the player says it is fine with them|Into the program, as long as it is kept quiet|Under the open rain shelter by the field|It is fine with the referee’s nod|Useful detail, once the gain goes up|It is fine if it is padded well|It blocks the sound almost completely|The alignment no longer fits|Move there with a marshal’s nod|You, if the plug sits well above the water|Yes, with the rider’s consent|The mic’s cable is picking up the engine’s ignition|Keep it there until the crowd arrives|Keep it until the doors open|Add them only at the big moments|They swap only for the replays|It should, by the largest delay found|Well, once the gain is turned up more)$/;
    const bad: string[] = [];
    for (const id of IDS) for (const q of items(lesson(id))) for (const o of q.options) if (GONE.test(o)) bad.push(`${id} ${q.id}: ${o}`);
    assert.deepEqual(bad, []);
  });

  it('B17: the M/S width words say a rear lobe is there at a modest width too', () => {
    const s = src('lessons/shared/sports/arenaPages.tsx');
    assert.match(s, /Each side already has a small opposite-polarity rear lobe \(dashed\); it grows with the width\./);
    assert.doesNotMatch(s, /Listen for what each output loses/);
  });
});
