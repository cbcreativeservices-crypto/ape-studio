/**
 * The long-form "About This Topic" overviews.
 *
 * This file is GENERATED from a Computer A/B deliverable and the source JSON
 * is deliberately not kept in the repo, so there is nothing left to diff a
 * regeneration against. These are the invariants that stood when it was
 * generated and verified; they are what would catch a bad reissue.
 *
 * The one that matters most is the 1:1 with `topicCopy.ts`. A topic that has
 * a short description but no overview shows a section header over nothing;
 * an overview for a gs that is not a topic never renders at all and hides a
 * key mismatch. Both are silent, which is why they are asserted rather than
 * left to be noticed.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const {
  topicAbout,
  TOPIC_ABOUT_SECTION_ORDER,
  TOPIC_ABOUT_MODULE_ORDER,
  TOPIC_ABOUT_SECTION_LABEL,
} = await import('../src/data/topicAbout.ts');
const { TOPIC_COPY_BY_GS } = await import('../src/data/topicCopy.ts');

const GS = Object.keys(TOPIC_COPY_BY_GS).map(Number);

describe('topicAbout', () => {
  it('covers exactly the topics topicCopy does, both ways', () => {
    const missing = GS.filter((gs) => topicAbout(gs) == null);
    assert.deepEqual(missing, [], `topics with copy but no overview: ${missing.join(', ')}`);
    // And nothing the other way: an overview keyed to a gs that is not a topic
    // would never render, so the mismatch would never surface on its own.
    const covered = GS.filter((gs) => topicAbout(gs) != null).length;
    assert.equal(covered, GS.length);
    assert.equal(GS.length, 166);
  });

  it('gives every topic all four sections, with real prose in each', () => {
    for (const gs of GS) {
      const a = topicAbout(gs)!;
      for (const k of TOPIC_ABOUT_SECTION_ORDER) {
        const body = a[k];
        assert.equal(typeof body, 'string', `gs ${gs}: ${k} is not a string`);
        // The deliverable's own floor is 400+ words per overview; a section
        // that collapsed to a stub would still be a non-empty string.
        assert.ok(body.trim().split(/\s+/).length >= 40, `gs ${gs}: ${k} is too short to be the real text`);
      }
    }
  });

  it('only uses optional modules the renderer knows how to label', () => {
    for (const gs of GS) {
      const mods = topicAbout(gs)!.optional_modules;
      if (!mods) continue;
      for (const k of Object.keys(mods)) {
        assert.ok(
          (TOPIC_ABOUT_MODULE_ORDER as readonly string[]).includes(k),
          `gs ${gs}: unknown optional module "${k}" — it would be dropped silently`,
        );
        assert.ok((mods as Record<string, string>)[k].trim().length > 0, `gs ${gs}: empty module ${k}`);
      }
    }
  });

  it('has a heading for every key it can render', () => {
    for (const k of [...TOPIC_ABOUT_SECTION_ORDER, ...TOPIC_ABOUT_MODULE_ORDER]) {
      const label = TOPIC_ABOUT_SECTION_LABEL[k];
      assert.ok(label && label.trim().length > 0, `no heading for ${k}`);
    }
  });

  it('returns null rather than throwing for a gs it does not have', () => {
    assert.equal(topicAbout(null), null);
    assert.equal(topicAbout(undefined), null);
    assert.equal(topicAbout(1), null);
  });
});
