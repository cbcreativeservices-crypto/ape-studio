/**
 * GUARD — the glossary's meter RPCs must be bounded.
 *
 * Owner 2026-09-22: "gets stuck when trying to open in free account." The
 * owner's own observation is what located it: a guest on Android sees the
 * device-key popup and a signed-in free user on iOS does not, so the two take
 * different paths —
 *
 *   guest           capMode 'local'    AsyncStorage, cannot hang on a network
 *   signed-in FREE  capMode 'server'   a network RPC, and it was UNBOUNDED
 *   member          not capped         never calls it at all
 *
 * GlossaryScreen's focus effect does `await getGlossaryStatus(capMode)` BEFORE
 * loading the corpus and clears `loading` in its `finally`. A promise that
 * never SETTLES — a stalled connection rather than a failed one — never reaches
 * that `finally`, so the screen shows its loading card forever, with no error
 * and no retry. try/catch cannot help: nothing is ever thrown.
 *
 * This is the third freeze on this screen traced to an unbounded wait (see also
 * the device-key deadline and getSessionSafe). The pattern is always the same,
 * and so is the fix: race a deadline and fail OPEN.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const raw = readFileSync(join(process.cwd(), 'src', 'features', 'glossary', 'glossaryCap.ts'), 'utf8');
const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('glossary meter RPCs cannot hang the screen', () => {
  test('there is a bounded wrapper with a deadline', () => {
    assert.match(code, /const CAP_RPC_TIMEOUT_MS = \d+/, 'the deadline constant is gone');
    assert.match(code, /async function boundedRpc/, 'boundedRpc is gone');
    assert.match(code, /Promise\.race\(/, 'boundedRpc no longer races a deadline');
  });

  test('every supabase.rpc call in this file goes through it', () => {
    // A bare `await supabase.rpc(...)` at the top level of one of these
    // functions is the exact shape that froze the screen.
    for (const m of code.matchAll(/supabase\.rpc\('([a-z_]+)'\)/g)) {
      const before = code.slice(0, m.index);
      const fnStart = Math.max(before.lastIndexOf('async function'), before.lastIndexOf('boundedRpc('));
      const segment = before.slice(fnStart);
      assert.ok(
        segment.includes('boundedRpc('),
        `supabase.rpc('${m[1]}') is not inside boundedRpc — an unbounded meter read freezes the glossary for a signed-in free user`,
      );
    }
  });

  test('a stall fails OPEN, never closed', () => {
    // A reader must never be shut out of the glossary because the meter could
    // not be read. At worst a lookup goes uncounted.
    assert.match(code, /'glossary_usage_status',\s*\)/s, 'statusServer no longer names itself to boundedRpc');
    assert.match(code, /\}, OPEN, 'glossary_consume'\)/, 'consumeServer no longer falls back to OPEN');
    assert.match(code, /resolve\(fallback\)/, 'the deadline no longer resolves to the fallback');
  });

  test('a stall is logged, not silent', () => {
    // It is a real device/network fault and is otherwise invisible.
    assert.match(code, /console\.warn\(`\[glossary\] \$\{what\} stalled/, 'a stalled meter RPC is no longer reported');
  });
});
