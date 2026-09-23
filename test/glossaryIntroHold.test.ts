/**
 * GUARD — the glossary intro must not draw over the device-key dialog.
 *
 * Owner 2026-09-22, from a fresh install on the Pixel: the "Welcome to the Pro
 * Audio Training Academy Glossary" card and the "Opening the glossary" consent
 * dialog rendered at the same instant, text through text. Both were illegible,
 * and AGREE / NOT NOW — the only way forward — sat buried mid-paragraph.
 *
 * Two overlays, each correct alone, neither aware of the other. The consent
 * dialog is raised from an effect on `keyState === 'ask'`; the intro rendered
 * unconditionally.
 *
 * ⛔ THE HOLD MUST DEFER, NOT RETIRE. `dismiss` is what writes the seen flag,
 * so an intro suppressed by `hold` is not consumed — it still appears, once,
 * after the blocking thing resolves. A fix that skipped it instead would silently
 * cost every fresh install its glossary introduction.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const intro = strip(read('src', 'features', 'intro', 'ScreenIntroOverlay.tsx'));
const glossary = strip(read('src', 'screens', 'glossary', 'GlossaryScreen.tsx'));

describe('glossary intro waits its turn', () => {
  test('the intro is held while the key decision is open', () => {
    assert.match(
      glossary,
      /<ScreenIntroOverlay introKey="glossary" hold=\{keyState !== 'ready' \|\| locked\} \/>/,
      'the glossary intro no longer waits for the device-key decision — it will draw over the consent dialog again',
    );
  });

  test('ScreenIntroOverlay accepts and honours hold', () => {
    assert.match(intro, /hold = false/, 'the hold prop is gone');
    assert.match(intro, /!suppressed && !hold/, 'hold no longer suppresses the render');
  });

  test('a held intro is NOT marked as seen', () => {
    // The seen flag is written in dismiss(), which a held intro never reaches.
    // If hold ever short-circuits before that, a fresh install loses its intro.
    const dismiss = intro.slice(intro.indexOf('const dismiss = useCallback'), intro.indexOf('return { visible:'));
    assert.match(dismiss, /AsyncStorage\.setItem\(INTRO_STORAGE_PREFIX \+ key/, 'dismiss no longer persists the seen flag');
    assert.ok(!/hold/.test(dismiss), 'hold leaked into dismiss — a deferred intro would be retired instead of shown later');
  });

  test('the lock also holds it', () => {
    // An intro about how to use the glossary makes no sense on top of a card
    // saying you have run out of lookups.
    assert.match(glossary, /\|\| locked\}/, 'the weekly lock no longer holds the intro back');
  });
});
