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

describe('Credential share: SHARE QR never sends a card with no QR', () => {
  it('the QR share refuses (and reloads) while the token has not arrived', () => {
    const src = read('features', 'credentials', 'CredentialShareRow.tsx');
    // `qrNow`: the body the latched `qr` press runs (pattern P9, 2026-10-02).
    const at = src.indexOf('const qrNow = useCallback(');
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
