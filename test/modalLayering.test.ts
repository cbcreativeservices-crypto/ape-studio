/**
 * GUARD — a second modal surface raised while a Modal is open must be IN-TREE.
 *
 * ⛔ THE RULE, AND IT IS NOT "NEVER NEST".
 *
 * On Android every RN `<Modal>` is its own Dialog window. A Modal rendered as a
 * SIBLING of an open Modal attaches to the ACTIVITY window, which sits BELOW
 * that open Dialog — so the surface is drawn behind the sheet that raised it,
 * unreadable and unreachable, and its buttons are dead. Device-verified
 * 2026-09-19 (`components/PrePaywallPrompt`): an anonymous user enrolled, the
 * button said ENROLLED ✓, and the one message telling them it would not be
 * saved was drawn behind the card.
 *
 * The codebase's answer is the `embedded` prop: drop the Modal wrapper and
 * render the same backdrop + card as an absolutely-positioned overlay placed
 * inside the open modal's own tree, which is then guaranteed to be on top.
 * Identical look either way. Nesting a Modal is therefore the FIX, not the bug
 * — `CredentialDetailModal` inside the Awards picker is deliberate and
 * documented — and a blanket "no nested Modals" rule would be wrong.
 *
 * So this guard checks the thing that is actually always wrong: a component
 * that OFFERS `embedded` being used inside an open Modal WITHOUT it. If a
 * component went to the trouble of supporting the in-tree mode, every call site
 * inside a Modal needs it.
 *
 * ⚠️ ONE THING `embedded` COSTS, and every fix here pays it: a Modal handles
 * Android's hardware BACK through `onRequestClose`; an in-tree overlay gets no
 * such callback. Each parent below therefore closes its overlay FIRST in its own
 * `onRequestClose`, or BACK would close the whole sheet out from under an open
 * child.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}
const SRC = join(process.cwd(), 'src');
const files = walk(SRC);
const rel = (f: string) => relative(process.cwd(), f).split(sep).join('/');

const blank = (s: string) => s.replace(/\n/g, '\u0001').replace(/[^\u0001]/g, ' ').replace(/\u0001/g, '\n');
const stripComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

/** Components that support the in-tree mode, by name. */
function embeddableComponents(): Map<string, string> {
  const out = new Map<string, string>();
  for (const f of files) {
    const code = stripComments(readFileSync(f, 'utf8'));
    if (!/\bembedded\?:\s*boolean/.test(code)) continue;
    for (const m of code.matchAll(/export\s+function\s+([A-Z][\w$]*)/g)) {
      // Only the component whose own props declare it.
      const after = code.slice(m.index!, m.index! + 2000);
      if (/\bembedded\b/.test(after)) out.set(m[1], f);
    }
  }
  return out;
}

describe('an overlay raised inside an open Modal is in-tree', () => {
  const embeddable = embeddableComponents();

  test('the in-tree mode still exists on the components that need it', () => {
    // If `embedded` were deleted the sweep below would pass vacuously.
    for (const name of ['PrePaywallPrompt', 'PresetFader', 'GlossaryTermPopup']) {
      assert.ok(embeddable.has(name), `${name} lost its \`embedded\` prop — every call site inside a Modal now renders behind it`);
    }
  });

  test('every use inside a Modal passes `embedded`', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const code = stripComments(readFileSync(file, 'utf8'));
      if (!code.includes('<Modal')) continue;
      for (const m of code.matchAll(/<Modal(?=[\s>])/g)) {
        const close = code.indexOf('</Modal>', m.index!);
        if (close < 0) continue;
        const inner = code.slice(m.index!, close);
        for (const [name, src] of embeddable) {
          if (src === file) continue; // its own definition
          for (const u of inner.matchAll(new RegExp('<' + name + '(?=[\\s/>])[\\s\\S]*?(?:/>|>)', 'g'))) {
            if (!/\bembedded\b/.test(u[0])) {
              const line = code.slice(0, m.index! + u.index!).split('\n').length;
              offenders.push(`${rel(file)}:${line} — <${name}/> inside an open Modal without \`embedded\``);
            }
          }
        }
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `a modal surface raised inside an open Modal will be drawn BEHIND it on Android — its buttons are dead:\n${offenders.join('\n')}`,
    );
  });

  test('each parent that embeds a child still handles Android BACK', () => {
    // An in-tree overlay has no onRequestClose of its own, so the PARENT has to
    // close the child first or BACK closes the whole sheet under it.
    const cases: [string[], RegExp, string][] = [
      [['src', 'screens', 'lab', 'calc', 'FormulaKeyPopup.tsx'], /popupTerm \? setPopupTerm\(null\) : onClose\(\)/, 'the term popup'],
      [['src', 'features', 'study', 'PaceTimerModal.tsx'], /faderOpen \? setFaderOpen\(false\) : onClose\(\)/, 'the pace fader'],
      [['src', 'screens', 'enrollment', 'HomeSetupSheet.tsx'], /if \(warn\) return setWarn\(false\);/, 'the notices'],
    ];
    for (const [path, re, what] of cases) {
      const code = stripComments(readFileSync(join(process.cwd(), ...path), 'utf8'));
      assert.match(code, re, `${path.join('/')} no longer closes ${what} on BACK — BACK will close the whole sheet instead`);
    }
  });

  test('a root-level notice is not shown while its own sheet is open', () => {
    // The stale-prompt window: close the detail card with a prompt pending and
    // the ROOT copy became a sibling Modal of a still-open sheet/picker.
    const awards = stripComments(readFileSync(join(SRC, 'screens', 'awards', 'AwardsScreen.tsx'), 'utf8'));
    assert.match(awards, /!!payPrompt && !detail && picker === null/, 'the Awards root notice can show over an open picker again');
    const explore = stripComments(readFileSync(join(SRC, 'screens', 'courses', 'StudyAreaExplore.tsx'), 'utf8'));
    assert.match(explore, /!!payPrompt && !detail && !visible/, 'the Study Area root notice can show over its own open sheet again');
  });
});
