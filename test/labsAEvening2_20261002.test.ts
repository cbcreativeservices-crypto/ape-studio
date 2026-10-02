/**
 * Labs A — evening toddler hunt, pass 2 (2026-10-02). Receipts.
 *
 *  • Sound Systems, Loads page (PageLoads, AMP = 300 W @ 8 Ω, 1000 W bridged
 *    @ 8 Ω): a single 16 Ω cabinet with BRIDGED on read "INTO LOAD 1000 W" —
 *    the 8 Ω bridged rating, twice what a voltage-limited bridge can put into
 *    16 Ω. The unbridged branch already scaled above 8 Ω (150 W into 16 Ω);
 *    the bridged one did not.
 * R2: run against the pre-fix loads.ts and failed.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = new Map<string, string>();
// House resolver hook (soundSystemsEngine.test.ts): extensionless sibling imports.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') {
      return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const loads = await import('../src/features/soundsystems/loads.ts');

describe('Sound Systems loads: bridged power above 8 Ω is voltage-limited', () => {
  const AMP = { at8: 300, at4: 500, minOhms: 4, bridged8: 1000, minOhmsBridged: 8 };

  it('one 16 Ω cabinet bridged gets half the 8 Ω bridged rating, like the unbridged branch', () => {
    assert.equal(loads.wattsIntoLoad(AMP, 16), 150); // unbridged: already scaled
    assert.equal(loads.wattsIntoLoad(AMP, 16, true), 500);
  });

  it('the rated point and the refusal below the bridged minimum are unchanged', () => {
    assert.equal(loads.wattsIntoLoad(AMP, 8, true), 1000);
    assert.equal(loads.wattsIntoLoad(AMP, 4, true), null);
    assert.equal(loads.wattsIntoLoad({ ...AMP, bridged8: undefined }, 16, true), null);
  });
});
