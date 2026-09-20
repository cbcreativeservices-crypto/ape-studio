/**
 * Scenario answer options must not be presented in the order they were authored.
 *
 * ── WHY THIS TEST EXISTS ─────────────────────────────────────────────────────
 *
 * A device run on 2026-09-20 scored 149/149 on Pro Audio Safety's scenarios
 * essentially by tapping the top option every time. It was not a lucky run: on
 * that topic the correct answer is the FIRST entry of `options_json` in 441 of
 * its 447 scenarios — only "Noise susceptibility" and "Occlusion effect"
 * deviate. The screen rendered the options verbatim, so the whole activity was
 * passable without reading a single question.
 *
 * That is an authoring artefact on one topic (DAW Fundamentals is properly
 * distributed at 133/109/112/126) and it should be fixed in the content too.
 * But the client must not be defeatable by it, and shuffling covers every
 * topic at once — including the ones nobody has audited yet.
 *
 * The order is SEEDED BY QUESTION ID rather than random, and that matters as
 * much as the shuffle: a mid-round resume has to show the learner the same
 * arrangement they left, and a remount mid-question must never move an option
 * out from under a finger already on its way down.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

/** scenarioHomework pulls in the supabase client, the progress emitter and the
 *  durable queue purely as a side effect of living in the same module. Only
 *  `seededOrder` is under test, so all three are stubbed out rather than
 *  dragged into a node --test run. */
const store = new Map<string, string>();
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('lib/supabase')) {
      return { url: new URL('./_stub-supabase.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === './sync') {
      return { url: new URL('./_stub-sync.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { seededOrder } = await import('../src/features/study/scenarioHomework.ts');

const OPTIONS = ['correct', 'wrong A', 'wrong B', 'wrong C'];

describe('scenario option order', () => {
  it('is stable for the same question id', () => {
    const a = seededOrder(OPTIONS, 'question-42');
    const b = seededOrder(OPTIONS, 'question-42');
    assert.deepEqual(a, b, 'a remount or a resume must not rearrange the options');
  });

  it('keeps every option exactly once', () => {
    const out = seededOrder(OPTIONS, 'question-42');
    assert.equal(out.length, OPTIONS.length);
    assert.deepEqual([...out].sort(), [...OPTIONS].sort(), 'no option may be dropped or duplicated');
  });

  it('does not leave the authored first option on top', () => {
    // The live failure mode, reproduced: 400 questions that all list the
    // correct answer first. Tapping position 0 every time must no longer pass.
    const ids = Array.from({ length: 400 }, (_, i) => `q-${i}`);
    const firstIsCorrect = ids.filter((id) => seededOrder(OPTIONS, id)[0] === 'correct').length;

    assert.ok(
      firstIsCorrect < ids.length * 0.5,
      `tapping the top option scored ${firstIsCorrect}/400 - the authored order is still leaking through`,
    );
    // Four options, so roughly a quarter should land on top by chance. Generous
    // bounds: this pins "shuffled", not the quality of the PRNG.
    assert.ok(
      firstIsCorrect > ids.length * 0.1,
      `only ${firstIsCorrect}/400 - the correct answer is being pushed AWAY from the top, which is its own tell`,
    );
  });

  it('gives different questions different arrangements', () => {
    const shapes = new Set(ids().map((id) => seededOrder(OPTIONS, id).join('|')));
    assert.ok(shapes.size > 1, 'every question got the same arrangement - the seed is not being used');
    function ids() {
      return Array.from({ length: 50 }, (_, i) => `q-${i}`);
    }
  });

  it('handles the degenerate inputs without throwing', () => {
    assert.deepEqual(seededOrder([], 'q'), []);
    assert.deepEqual(seededOrder(['only'], 'q'), ['only']);
    assert.deepEqual(seededOrder(OPTIONS, '').length, 4);
  });
});
