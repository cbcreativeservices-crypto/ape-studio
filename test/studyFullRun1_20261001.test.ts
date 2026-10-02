/**
 * GUARD — STUDY area, full-app bug run 1 (2026-10-01 evening).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';
import { describe, it, mock } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const store = new Map<string, string>();
(globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = store;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('lib/supabase')) {
      return { url: new URL('./_stub-supabase-rpc.mjs', import.meta.url).href, shortCircuit: true };
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

const read = (...p: string[]) => readFileSync(join(process.cwd(), 'src', ...p), 'utf8');
const setRpc = (fn: (name: string) => unknown) => {
  (globalThis as Record<string, unknown>).__RPC__ = fn;
};
const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

describe('Time Trial: a pass is not reported as cleared until the server has it', () => {
  it('saving → saved when it lands; saving → failed after the last retry', async () => {
    mock.timers.enable({ apis: ['setInterval', 'setTimeout', 'Date'], now: 1_000_000 });
    try {
      const tt = await import('../src/features/study/timeTrial.ts');
      // Read the live snapshot through the real hook (server render uses the
      // hook's getServerSnapshot, which is the same getter).
      const credit = (m: 'flashcards' | 'matching') => {
        let out: unknown = 'none';
        const Probe = () => {
          const s = tt.useTimeTrial(m, 'topic-a');
          out = s.result ? (s.result.credit ?? 'unset') : 'no-result';
          return null;
        };
        renderToStaticMarkup(createElement(Probe));
        return out;
      };
      const runToPass = (m: 'flashcards' | 'matching') => {
        tt.startTimeTrial(m, 'topic-a');
        for (let i = 0; i < tt.TIME_TRIAL_NEEDED; i++) tt.registerTrialAnswer(m, true, 'topic-a');
        mock.timers.tick(tt.TIME_TRIAL_SECONDS * 1000 + 1000);
      };

      // 1. The server records it.
      let release!: () => void;
      setRpc(() => new Promise((r) => (release = () => r({ data: null, error: null }))));
      runToPass('flashcards');
      await flush(); // run 2: the account check comes first
      assert.equal(credit('flashcards'), 'saving', 'before the credit lands the pass must not read as saved');
      release();
      await flush();
      assert.equal(credit('flashcards'), 'saved');

      // 2. The server never takes it (offline / no account), through every retry.
      setRpc(() => ({ data: null, error: { message: 'Failed to fetch' } }));
      runToPass('matching');
      await flush();
      assert.equal(credit('matching'), 'saving');
      for (const ms of [5_000, 15_000, 45_000, 120_000, 300_000]) {
        mock.timers.tick(ms);
        await flush();
      }
      assert.equal(credit('matching'), 'failed', 'a pass the server never recorded must say so');

      tt.resetTimeTrials();
    } finally {
      mock.timers.reset();
    }
  });

  it('the result panel only claims "cleared" once the credit is saved', () => {
    const src = read('features', 'study', 'PaceReadout.tsx');
    assert.match(src, /trial\.result\.credit === 'failed'/);
    assert.match(src, /trial\.result\.credit === 'saving'/);
  });
});

describe('Credential share: SHARE QR never sends a card with no QR', () => {
  it('the QR share refuses (and reloads) while the token has not arrived', () => {
    const src = read('features', 'credentials', 'CredentialShareRow.tsx');
    const at = src.indexOf('const qr = useCallback(');
    assert.ok(at > 0);
    const guard = src.indexOf('if (!token)', at);
    const capture = src.indexOf('captureAndShare(', at);
    assert.ok(guard > at && guard < capture, 'the token check must come before the capture');
  });
});

describe('Flashcards: no tutorial / expiry banner Modal over the screen\'s own open Modal', () => {
  it('the term list and the session-length picker hold them back', () => {
    const src = read('screens', 'study', 'FlashcardsScreen.tsx');
    const m = src.match(/const tutorialBlocked =([\s\S]*?);/);
    assert.ok(m, 'tutorialBlocked missing');
    assert.match(m[1], /!!termList/);
    assert.match(m[1], /sessionTimer\.configOpen/);
    assert.match(src, /\{tutorialBlocked \? null : <SessionTimerBanner/);
  });
});
